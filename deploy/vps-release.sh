#!/usr/bin/env bash
set -euo pipefail
umask 077
release_dir="${1:?release directory required}"
case "$release_dir" in /opt/benny-portfolio/releases/*) ;; *) exit 1 ;; esac
test -f "$release_dir/application.yaml"
install -d -m 700 /etc/benny-portfolio /var/backups/benny-portfolio

python3 - <<'PY'
import base64, json, os, secrets, subprocess
from pathlib import Path
p = Path('/etc/benny-portfolio/credentials.json')
existing = subprocess.run(['kubectl','-n','demos','get','secret','portfolio-secrets','--ignore-not-found','-o','json'], check=True, capture_output=True, text=True).stdout.strip()
if existing:
    if not p.exists():
        raise SystemExit('Existing portfolio Secret has no credential record; refusing to overwrite it.')
else:
    if p.exists():
        raise SystemExit('Credential file exists but Kubernetes Secret is missing; restore explicitly before deployment.')
    password, admin = secrets.token_hex(32), secrets.token_hex(32)
    values = {'POSTGRES_PASSWORD':password,'DATABASE_URL':f'postgresql://portfolio:{password}@portfolio-db:5432/portfolio','ADMIN_USERNAME':'admin','ADMIN_PASSWORD':admin}
    with p.open('x', encoding='utf-8') as f:
        os.chmod(p, 0o600)
        json.dump(values, f)
    secret = {'apiVersion':'v1','kind':'Secret','metadata':{'name':'portfolio-secrets','namespace':'demos'},'type':'Opaque','data':{k:base64.b64encode(v.encode()).decode() for k,v in values.items()}}
    subprocess.run(['kubectl','create','-f','-'], input=json.dumps(secret), text=True, check=True, stdout=subprocess.DEVNULL)
print('Portfolio server credentials present; values withheld.')
PY

kubectl apply --dry-run=server -f "$release_dir/application.yaml" >/dev/null
# Start the database before app Pods so its PVC is ready before API initialization.
python3 - "$release_dir/application.yaml" <<'PY' | kubectl apply -f -
import re, sys
parts = re.split(r'^---\s*$', open(sys.argv[1]).read(), flags=re.M)
print('\n---\n'.join(p for p in parts if re.search(r'^kind: (StatefulSet|Service)$', p, re.M) and re.search(r'^  name: portfolio-db$', p, re.M)))
PY
kubectl -n demos rollout status statefulset/portfolio-db --timeout=300s
kubectl apply -f "$release_dir/application.yaml"
kubectl -n demos rollout status deployment/portfolio-api --timeout=300s
kubectl -n demos rollout status deployment/portfolio-web --timeout=300s
if [ -f "$release_dir/source/deploy/vps-web.py" ]; then
    python3 "$release_dir/source/deploy/vps-web.py"
fi
ln -sfn "$release_dir" /opt/benny-portfolio/current
kubectl -n demos get pods,pvc,resourcequota
