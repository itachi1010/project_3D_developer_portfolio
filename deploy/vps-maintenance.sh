#!/usr/bin/env bash
set -euo pipefail
umask 077
install -d -m 700 /opt/benny-portfolio/ops /etc/benny-portfolio/letsencrypt /var/log/benny-portfolio-acme /var/lib/benny-portfolio-acme
source_dir="${1:?source deploy directory required}"
for file in vps-acme-hook.py vps-tls-install.py vps-backup.sh; do
    if [ "$(readlink -f "$source_dir/$file")" != "/opt/benny-portfolio/ops/$file" ]; then
        install -m 700 "$source_dir/$file" "/opt/benny-portfolio/ops/$file"
    else
        chmod 700 "/opt/benny-portfolio/ops/$file"
    fi
done
cat > /etc/systemd/system/benny-portfolio-backup.service <<'UNIT'
[Unit]
Description=Back up only the portfolio PostgreSQL database
After=k3s.service
[Service]
Type=oneshot
ExecStart=/opt/benny-portfolio/ops/vps-backup.sh
Nice=15
IOSchedulingClass=idle
CPUQuota=15%
MemoryMax=128M
UNIT
cat > /etc/systemd/system/benny-portfolio-backup.timer <<'UNIT'
[Unit]
Description=Daily portfolio database backup
[Timer]
OnCalendar=*-*-* 03:35:00 UTC
RandomizedDelaySec=900
Persistent=true
[Install]
WantedBy=timers.target
UNIT
cat > /etc/systemd/system/benny-portfolio-renew.service <<'UNIT'
[Unit]
Description=Renew only the portfolio TLS certificate
After=network-online.target k3s.service
ConditionPathExists=/etc/benny-portfolio/letsencrypt/renewal/bennyuchiha.tech.conf
[Service]
Type=oneshot
ExecStart=/opt/benny-portfolio/acme/bin/certbot renew --quiet --config-dir /etc/benny-portfolio/letsencrypt --work-dir /var/lib/benny-portfolio-acme --logs-dir /var/log/benny-portfolio-acme
Nice=15
CPUQuota=20%
MemoryMax=256M
UNIT
cat > /etc/systemd/system/benny-portfolio-renew.timer <<'UNIT'
[Unit]
Description=Check portfolio certificate renewal twice daily
[Timer]
OnCalendar=*-*-* 02,14:15:00 UTC
RandomizedDelaySec=1800
Persistent=true
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now benny-portfolio-backup.timer benny-portfolio-renew.timer
echo 'Portfolio backup and certificate renewal timers configured.'
