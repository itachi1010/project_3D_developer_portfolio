"""Certbot hook: publish HTTP-01 token through the portfolio's mounted ConfigMap."""
import json
import os
import re
import subprocess
import sys
import time
import urllib.request

token = os.environ['CERTBOT_TOKEN']
domain = os.environ['CERTBOT_DOMAIN']
if domain not in {'bennyuchiha.tech','www.bennyuchiha.tech'} or not re.fullmatch(r'[A-Za-z0-9_-]+', token):
    raise SystemExit('Unexpected certificate domain or challenge token.')
cleanup = '--cleanup' in sys.argv
validation = os.environ['CERTBOT_VALIDATION']
existing = subprocess.check_output(['kubectl','-n','demos','get','configmap','portfolio-acme','--ignore-not-found','-o','json'],text=True).strip()
data = json.loads(existing).get('data',{}) if existing else {}
if cleanup:
    data.pop(token,None)
else:
    data[token]=validation
resource = {'apiVersion':'v1','kind':'ConfigMap','metadata':{'name':'portfolio-acme','namespace':'demos'},'data':data}
subprocess.run(['kubectl','apply','-f','-'],input=json.dumps(resource),text=True,check=True,stdout=subprocess.DEVNULL)
subprocess.run(['kubectl','-n','demos','annotate','pod','-l','app=portfolio-web','--overwrite','bennyuchiha.tech/acme-refresh='+str(time.time_ns())],check=True,stdout=subprocess.DEVNULL)
if not cleanup:
    for attempt in range(120):
        try:
            request=urllib.request.Request('http://127.0.0.1/.well-known/acme-challenge/'+token,headers={'Host':domain})
            with urllib.request.urlopen(request,timeout=5) as response:
                if response.read().decode().strip()==validation:
                    print('Portfolio HTTP-01 token is being served.')
                    break
        except Exception:
            pass
        time.sleep(2)
    else:
        raise SystemExit('Portfolio challenge did not become available within four minutes.')
