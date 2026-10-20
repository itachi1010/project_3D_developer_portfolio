"""Fixed VPS agent: pull main, verify its CI release, and update only portfolio images."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import tarfile
import time
import urllib.error
import urllib.request

REPOSITORY = 'itachi1010/project_3D_developer_portfolio'
SOURCE_URL = f'https://github.com/{REPOSITORY}.git'
ROOT = Path('/var/lib/benny-portfolio-git')
CHECKOUT = ROOT / 'source'
RELEASES = ROOT / 'releases'
STATE = ROOT / 'status.json'
SHA = re.compile(r'[0-9a-f]{40}')
DIGEST = re.compile(r'sha256:[0-9a-f]{64}')


def command(args, **kwargs):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=360, **kwargs).stdout.strip()


def kubectl(*args):
    return command(['kubectl', '--kubeconfig=/etc/rancher/k3s/k3s.yaml', '-n', 'demos', *args])


def normalized(reference):
    return reference if reference.startswith('docker.io/library/') else 'docker.io/library/' + reference


def validate_metadata(metadata, commit):
    if not SHA.fullmatch(commit) or metadata.get('schema_version') != 1 or metadata.get('repository') != REPOSITORY or metadata.get('commit') != commit:
        raise ValueError('Release does not match the selected repository/commit/schema.')
    images = metadata.get('images', {})
    if set(images) != {'api', 'web'}:
        raise ValueError('Release must contain only the portfolio API and frontend.')
    for role, image in images.items():
        if image.get('reference') != f'benny-portfolio-{role}:git-{commit}' or not DIGEST.fullmatch(image.get('id', '')):
            raise ValueError('Unexpected image name, tag or image ID.')
    return images


def validate_archive(path, expected):
    with tarfile.open(path, 'r:gz') as archive:
        try:
            manifest = json.load(archive.extractfile('manifest.json'))
            references = {normalized(tag) for entry in manifest for tag in entry.get('RepoTags', [])}
        except KeyError:
            index = json.load(archive.extractfile('index.json'))
            references = {normalized(entry.get('annotations', {}).get('io.containerd.image.name', '')) for entry in index['manifests']}
    if references != {normalized(image['reference']) for image in expected.values()}:
        raise ValueError('Image archive contains foreign or missing image names; import refused.')


def request(url):
    headers = {'User-Agent':'Benedict-Portfolio-Deploy/1.0','Accept':'application/vnd.github+json','Cache-Control':'no-cache'}
    return urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=120)


def fetch_json(url):
    with request(url) as response:
        return json.load(response)


def save_state(value):
    temporary = STATE.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, indent=2) + '\n')
    temporary.replace(STATE)


def source_commit():
    git = ['git', '-c', 'core.hooksPath=/dev/null']
    if not (CHECKOUT / '.git').is_dir():
        command([*git, 'clone', '--depth', '1', '--branch', 'main', '--single-branch', SOURCE_URL, str(CHECKOUT)])
    if command([*git, '-C', str(CHECKOUT), 'remote', 'get-url', 'origin']) != SOURCE_URL:
        raise ValueError('Unexpected Git origin; refusing to fetch.')
    command([*git, '-C', str(CHECKOUT), 'fetch', '--depth', '1', '--prune', 'origin', 'main'])
    commit = command([*git, '-C', str(CHECKOUT), 'rev-parse', 'origin/main'])
    if not SHA.fullmatch(commit):
        raise ValueError('Invalid main commit ID.')
    command([*git, '-C', str(CHECKOUT), 'checkout', '--detach', commit])
    return commit


def download_release(commit):
    try:
        release = fetch_json(f'https://api.github.com/repos/{REPOSITORY}/releases/tags/portfolio-{commit}')
    except urllib.error.HTTPError as error:
        if error.code == 404:
            return None
        raise
    if release.get('draft') or release.get('prerelease') or release.get('tag_name') != 'portfolio-' + commit:
        return None
    assets = {a['name']:a for a in release.get('assets', [])}
    names = {'images.tar.gz', 'release.json', 'SHA256SUMS'}
    if not names.issubset(assets):
        return None
    directory = RELEASES / commit
    directory.mkdir(exist_ok=True, mode=0o700)
    for name in sorted(names):
        url = f'https://github.com/{REPOSITORY}/releases/download/portfolio-{commit}/{name}'
        if assets[name]['browser_download_url'] != url:
            raise ValueError('Unexpected release asset URL.')
        destination = directory / name
        if destination.exists() and destination.stat().st_size == assets[name]['size']:
            continue
        temporary = directory / (name + '.part')
        with request(url) as response, temporary.open('wb') as output:
            shutil.copyfileobj(response, output, length=1024 * 1024)
        if temporary.stat().st_size != assets[name]['size']:
            raise ValueError('Incomplete release download.')
        temporary.replace(destination)
    hashes = {}
    for line in (directory / 'SHA256SUMS').read_text().splitlines():
        digest, name = line.split()
        if name not in {'images.tar.gz', 'release.json'} or not re.fullmatch(r'[0-9a-f]{64}', digest):
            raise ValueError('Unexpected checksum file contents.')
        hashes[name] = digest
    if set(hashes) != {'images.tar.gz', 'release.json'}:
        raise ValueError('Missing release checksum.')
    for name, expected in hashes.items():
        with (directory / name).open('rb') as source:
            if hashlib.file_digest(source, 'sha256').hexdigest() != expected:
                raise ValueError('Release checksum mismatch.')
    metadata = json.loads((directory / 'release.json').read_text())
    images = validate_metadata(metadata, commit)
    validate_archive(directory / 'images.tar.gz', images)
    return directory, images


def current_images():
    return {role:json.loads(kubectl('get','deployment','portfolio-'+role,'-o','json'))['spec']['template']['spec']['containers'][0]['image'] for role in ['api','web']}


def set_image(role, reference):
    kubectl('set','image','deployment/portfolio-'+role,role+'='+reference)
    kubectl('rollout','status','deployment/portfolio-'+role,'--timeout=300s')


def verify_site(commit):
    address = kubectl('get','service','portfolio-web','-o','jsonpath={.spec.clusterIP}')
    for attempt in range(15):
        try:
            for path in ['/healthz','/api/ready']:
                with request(f'http://{address}:8080'+path) as response:
                    if response.status != 200:
                        raise ValueError('Application health check failed.')
            deployed = fetch_json(f'http://{address}:8080/release.json')
            if deployed.get('commit') != commit or deployed.get('repository') != REPOSITORY:
                raise ValueError('Running frontend is not the selected Git commit.')
            return
        except Exception:
            if attempt == 14:
                raise
            time.sleep(2)


def activate_release(images, old_images, commit):
    try:
        for role in ['api','web']:
            set_image(role, normalized(images[role]['reference']))
        verify_site(commit)
    except Exception as error:
        print('Deployment failed; restoring previous portfolio images.', flush=True)
        rollback_errors = []
        for role in ['api','web']:
            try:
                set_image(role, old_images[role])
            except Exception as rollback_error:
                rollback_errors.append(str(rollback_error))
        raise RuntimeError(f'{error}; rollback errors: {rollback_errors}') from error


def main():
    import fcntl
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--status', action='store_true')
    parser.add_argument('--retry', action='store_true')
    args = parser.parse_args()
    if args.status:
        print(STATE.read_text() if STATE.exists() else 'No Git-based deployment recorded yet.')
        return
    os.umask(0o077)
    ROOT.mkdir(exist_ok=True, mode=0o700)
    RELEASES.mkdir(exist_ok=True, mode=0o700)
    with (ROOT / 'sync.lock').open('w') as lock:
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            print('Another portfolio sync is already running.')
            return
        previous = json.loads(STATE.read_text()) if STATE.exists() else {}
        commit = source_commit()
        if previous.get('commit') == commit:
            print('Already deployed Git commit ' + commit)
            return
        if previous.get('failed_commit') == commit and not args.retry:
            print('This commit failed deployment and was rolled back. Push a fix or use --retry.')
            return
        release = download_release(commit)
        if release is None:
            print('Pulled ' + commit + '; waiting for its successful GitHub Actions release.')
            return
        directory, images = release
        if source_commit() != commit:
            print('A newer main commit arrived; waiting for its matching build.')
            return
        command(['k3s','ctr','images','import',str(directory/'images.tar.gz')])
        for image in images.values():
            inspected = json.loads(command(['k3s','crictl','inspecti',normalized(image['reference'])]))
            if inspected['status']['id'] != image['id']:
                raise ValueError('Imported image ID differs from GitHub build metadata.')
        old_images = current_images()
        backup = Path('/opt/benny-portfolio/ops/vps-backup.sh')
        if backup.is_file():
            command(['bash', str(backup)])
        try:
            activate_release(images, old_images, commit)
        except Exception as error:
            previous.update(failed_commit=commit, error=str(error))
            save_state(previous)
            raise
        save_state({'commit':commit,'repository':REPOSITORY,'deployed_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime()),'images':images,'previous_images':old_images})
        print('Successfully deployed GitHub commit ' + commit, flush=True)
        old = sorted([p for p in RELEASES.iterdir() if p.is_dir() and not p.is_symlink() and SHA.fullmatch(p.name)],key=lambda p:p.stat().st_mtime,reverse=True)
        for directory in old[3:]:
            if directory.name != commit and directory.resolve().parent == RELEASES.resolve():
                shutil.rmtree(directory)


if __name__ == '__main__':
    main()
