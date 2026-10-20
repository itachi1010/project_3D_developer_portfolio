"""VPS-local smoke check. Uses only portfolio credentials and removes its own test row."""
import base64
import json
from pathlib import Path
import subprocess
import sys
import time
import urllib.error
import urllib.request

credentials=json.loads(Path('/etc/benny-portfolio/credentials.json').read_text())
address=subprocess.check_output(['kubectl','-n','demos','get','svc','portfolio-web','-o','jsonpath={.spec.clusterIP}'],text=True)
base='http://'+address+':8080'
authorization='Basic '+base64.b64encode((credentials['ADMIN_USERNAME']+':'+credentials['ADMIN_PASSWORD']).encode()).decode()

def request(path, method='GET', data=None, auth=False):
    headers={'Content-Type':'application/json'}
    if auth:
        headers['Authorization']=authorization
    req=urllib.request.Request(base+path,method=method,data=None if data is None else json.dumps(data).encode(),headers=headers)
    try:
        with urllib.request.urlopen(req,timeout=20) as response:
            return response.status,response.read()
    except urllib.error.HTTPError as error:
        return error.code,error.read()

record=None
try:
    for path in ['/','/healthz','/api/health','/api/ready','/Benedict-Onah-Resume.pdf','/models/phone/quaternius-phone.glb','/images/benedict-chuks-onah.jpeg']:
        status,body=request(path)
        assert status==200,(path,status)
        if path=='/':
            assert b'Benedict Chuks-Onah' in body
    status,body=request('/api/jobs')
    jobs=json.loads(body)['jobs']
    assert status==200 and len(jobs)==3
    assert jobs[0]['date'].startswith('May 2024')
    assert request('/api/admin/session')[0]==401
    assert request('/api/admin/session',auth=True)[0]==200
    data={'title':'Portfolio VPS deployment check','company_name':'Temporary deployment check','date':'Test only','points':['temporary record']}
    for method,path in [('POST','/api/jobs'),('PUT','/api/jobs/999999'),('DELETE','/api/jobs/999999')]:
        assert request(path,method,data)[0]==401
    status,body=request('/api/jobs','POST',data,True)
    assert status==201
    record=json.loads(body)['job']['id']
    data['title']='Portfolio persistence check'
    assert request('/api/jobs/'+str(record),'PUT',data,True)[0]==200
    if '--restart-database' in sys.argv:
        subprocess.run(['kubectl','-n','demos','delete','pod','portfolio-db-0','--wait=true'],check=True)
        subprocess.run(['kubectl','-n','demos','rollout','status','statefulset/portfolio-db','--timeout=240s'],check=True)
        for i in range(60):
            try:
                if request('/api/ready')[0]==200:
                    break
            except Exception:
                pass
            time.sleep(2)
        else:
            raise AssertionError('API did not recover after portfolio DB replacement.')
    status,body=request('/api/jobs')
    saved=next(j for j in json.loads(body)['jobs'] if j['id']==record)
    assert saved['title']==data['title']
    print('PASS: VPS frontend, assets, verified profile, probes, authentication, CRUD'+(', database persistence after pod replacement.' if '--restart-database' in sys.argv else '.'))
finally:
    if record is not None:
        assert request('/api/jobs/'+str(record),'DELETE',auth=True)[0]==200
