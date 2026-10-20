import importlib.util
import io
import json
from pathlib import Path
import tarfile
import tempfile
import unittest
from unittest import mock

spec=importlib.util.spec_from_file_location('github_sync',Path(__file__).with_name('github-sync.py'))
sync=importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class ReleaseValidationTests(unittest.TestCase):
    def metadata(self):
        commit='a'*40
        return {'schema_version':1,'repository':sync.REPOSITORY,'commit':commit,'images':{role:{'reference':f'benny-portfolio-{role}:git-{commit}','id':'sha256:'+'b'*64} for role in ['api','web']}}

    def test_expected_repository_commit_and_images_are_accepted(self):
        self.assertEqual(set(sync.validate_metadata(self.metadata(),'a'*40)),{'api','web'})

    def test_foreign_commit_repository_or_image_are_rejected(self):
        for field,value in [('commit','c'*40),('repository','another/project')]:
            data=self.metadata();data[field]=value
            with self.assertRaises(ValueError):sync.validate_metadata(data,'a'*40)
        data=self.metadata();data['images']['api']['reference']='cresol-store-backend:latest'
        with self.assertRaises(ValueError):sync.validate_metadata(data,'a'*40)

    def archive(self, directory, refs, oci=False):
        path=Path(directory)/'images.tar.gz'
        if oci:
            data={'manifests':[{'annotations':{'io.containerd.image.name':sync.normalized(r)}} for r in refs]}
        else:
            data=[{'RepoTags':refs}]
        content=json.dumps(data).encode()
        with tarfile.open(path,'w:gz') as archive:
            member=tarfile.TarInfo('index.json' if oci else 'manifest.json');member.size=len(content)
            archive.addfile(member,io.BytesIO(content))
        return path

    def test_docker_and_oci_archives_allow_only_expected_image_names(self):
        images=sync.validate_metadata(self.metadata(),'a'*40)
        refs=[v['reference'] for v in images.values()]
        with tempfile.TemporaryDirectory() as directory:
            for oci in [False,True]:
                sync.validate_archive(self.archive(directory,refs,oci),images)
                with self.assertRaises(ValueError):
                    sync.validate_archive(self.archive(directory,refs+['cresol-backend:latest'],oci),images)

    def test_unhealthy_release_restores_both_previous_portfolio_images(self):
        images=self.metadata()['images']
        previous={'api':'old-portfolio-api','web':'old-portfolio-web'}
        with mock.patch.object(sync,'set_image') as update, mock.patch.object(sync,'verify_site',side_effect=ValueError('not ready')):
            with self.assertRaises(RuntimeError):sync.activate_release(images,previous,'a'*40)
            self.assertEqual(update.call_args_list[-2:],[mock.call('api',previous['api']),mock.call('web',previous['web'])])

    def test_failed_frontend_rollout_still_restores_api_and_frontend(self):
        previous={'api':'old-portfolio-api','web':'old-portfolio-web'}
        calls=[]
        def update(role,reference):
            calls.append((role,reference))
            if role=='web' and reference!=previous['web']:raise ValueError('frontend rollout failed')
        with mock.patch.object(sync,'set_image',side_effect=update):
            with self.assertRaises(RuntimeError):sync.activate_release(self.metadata()['images'],previous,'a'*40)
        self.assertEqual(calls[-2:],[('api',previous['api']),('web',previous['web'])])


if __name__=='__main__':unittest.main()
