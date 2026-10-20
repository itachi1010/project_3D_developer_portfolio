"""Configure only portfolio routing and HTTP-01 validation on the VPS."""
import json
import hashlib
from pathlib import Path
import subprocess


def apply(resource):
    subprocess.run(['kubectl', 'apply', '-f', '-'], input=json.dumps(resource), text=True, check=True)


nginx = (Path(__file__).resolve().parent / 'nginx.conf').read_text()
nginx = nginx.replace('        location /api/ {', '        location ^~ /.well-known/acme-challenge/ {\n            alias /var/run/acme/;\n            default_type text/plain;\n            add_header Cache-Control "no-store" always;\n        }\n        location /api/ {')
apply({'apiVersion':'v1','kind':'ConfigMap','metadata':{'name':'portfolio-public-nginx','namespace':'demos'},'data':{'nginx.conf':nginx}})
patch = {'spec':{'template':{'metadata':{'annotations':{'bennyuchiha.tech/nginx-sha256':hashlib.sha256(nginx.encode()).hexdigest()}},'spec':{
    'containers':[{'name':'web','volumeMounts':[
        {'name':'public-nginx','mountPath':'/etc/nginx/nginx.conf','subPath':'nginx.conf','readOnly':True},
        {'name':'acme','mountPath':'/var/run/acme','readOnly':True}]}],
    'volumes':[{'name':'public-nginx','configMap':{'name':'portfolio-public-nginx'}},
               {'name':'acme','configMap':{'name':'portfolio-acme','optional':True}}]
}}}}
subprocess.run(['kubectl','-n','demos','patch','deployment','portfolio-web','--type=strategic','--patch',json.dumps(patch)],check=True)
subprocess.run(['kubectl','-n','demos','rollout','status','deployment/portfolio-web','--timeout=240s'],check=True)
apply({'apiVersion':'traefik.io/v1alpha1','kind':'Middleware','metadata':{'name':'portfolio-https','namespace':'demos'},'spec':{'redirectScheme':{'scheme':'https','permanent':True}}})
for name, path, entrypoint, redirect in [
    ('portfolio-http','/','web',True),
    ('portfolio-acme','/.well-known/acme-challenge/','web',False),
    ('portfolio-public','/','websecure',False),
]:
    annotations={'traefik.ingress.kubernetes.io/router.entrypoints':entrypoint}
    if redirect:
        annotations['traefik.ingress.kubernetes.io/router.middlewares']='demos-portfolio-https@kubernetescrd'
    hosts=['bennyuchiha.tech','www.bennyuchiha.tech']
    spec={'ingressClassName':'traefik','rules':[{'host':host,'http':{'paths':[{'path':path,'pathType':'Prefix','backend':{'service':{'name':'portfolio-web','port':{'number':8080}}}}]}} for host in hosts]}
    if entrypoint=='websecure':
        annotations['traefik.ingress.kubernetes.io/router.tls']='true'
        spec['tls']=[{'hosts':hosts,'secretName':'portfolio-tls'}]
    apply({'apiVersion':'networking.k8s.io/v1','kind':'Ingress','metadata':{'name':name,'namespace':'demos','annotations':annotations},'spec':spec})
print('Portfolio hostname routes configured. Valid public HTTPS requires certificate issuance.')
