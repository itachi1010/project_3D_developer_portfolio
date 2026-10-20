"""Certbot deploy hook: refresh this portfolio's TLS Secret only."""
import base64
import json
import os
from pathlib import Path
import subprocess

directory=Path(os.environ.get('RENEWED_LINEAGE','/etc/benny-portfolio/letsencrypt/live/bennyuchiha.tech')).resolve()
expected=Path('/etc/benny-portfolio/letsencrypt/live/bennyuchiha.tech').resolve()
if directory != expected:
    raise SystemExit('Refusing a certificate outside the portfolio lineage.')
secret={'apiVersion':'v1','kind':'Secret','metadata':{'name':'portfolio-tls','namespace':'demos'},'type':'kubernetes.io/tls','data':{
    'tls.crt':base64.b64encode((directory/'fullchain.pem').read_bytes()).decode(),
    'tls.key':base64.b64encode((directory/'privkey.pem').read_bytes()).decode(),
}}
subprocess.run(['kubectl','apply','-f','-'],input=json.dumps(secret),text=True,check=True,stdout=subprocess.DEVNULL)
print('Portfolio TLS Secret updated; certificate/private key withheld.')
