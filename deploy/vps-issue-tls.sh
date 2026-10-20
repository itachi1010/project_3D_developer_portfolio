#!/usr/bin/env bash
set -euo pipefail
umask 077
public_address="$(python3 - <<'PY'
import json, urllib.request
root_address=None
for domain in ['bennyuchiha.tech','www.bennyuchiha.tech']:
    request=urllib.request.Request('https://dns.google/resolve?name='+domain+'&type=A')
    with urllib.request.urlopen(request,timeout=20) as response:
        result=json.load(response)
    addresses={a['data'] for a in result.get('Answer',[]) if a['type']==1}
    if not addresses:
        raise SystemExit('Public IPv4 DNS is unavailable: '+domain)
    if domain=='bennyuchiha.tech':
        root_address=sorted(addresses)[0]
print(root_address)
PY
)"
export CERTBOT_DOMAIN=bennyuchiha.tech
export CERTBOT_TOKEN="portfolio-preflight-$(openssl rand -hex 12)"
export CERTBOT_VALIDATION="portfolio-preflight-$(openssl rand -hex 24)"
cleanup() { python3 /opt/benny-portfolio/ops/vps-acme-hook.py --cleanup; }
trap cleanup EXIT
python3 /opt/benny-portfolio/ops/vps-acme-hook.py
actual="$(curl --fail --silent --show-error --max-time 20 --resolve "bennyuchiha.tech:80:$public_address" "http://bennyuchiha.tech/.well-known/acme-challenge/$CERTBOT_TOKEN")"
if [ "$actual" != "$CERTBOT_VALIDATION" ]; then
    echo 'Public domain is not serving the portfolio challenge yet. Fix DNS before certificate issuance.' >&2
    exit 1
fi
cleanup
trap - EXIT
unset CERTBOT_TOKEN CERTBOT_VALIDATION CERTBOT_DOMAIN
/opt/benny-portfolio/acme/bin/certbot certonly --non-interactive --agree-tos \
    --email onahben977@gmail.com --manual --preferred-challenges http \
    --manual-auth-hook 'python3 /opt/benny-portfolio/ops/vps-acme-hook.py' \
    --manual-cleanup-hook 'python3 /opt/benny-portfolio/ops/vps-acme-hook.py --cleanup' \
    --deploy-hook 'python3 /opt/benny-portfolio/ops/vps-tls-install.py' \
    --cert-name bennyuchiha.tech -d bennyuchiha.tech -d www.bennyuchiha.tech \
    --config-dir /etc/benny-portfolio/letsencrypt \
    --work-dir /var/lib/benny-portfolio-acme --logs-dir /var/log/benny-portfolio-acme
curl --fail --silent --show-error --resolve bennyuchiha.tech:443:45.9.191.177 \
    https://bennyuchiha.tech/api/ready
