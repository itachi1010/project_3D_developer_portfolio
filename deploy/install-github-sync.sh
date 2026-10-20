#!/usr/bin/env bash
set -euo pipefail
umask 077
source_dir="${1:?deploy source directory required}"
install -d -m 700 /opt/benny-portfolio/ops /var/lib/benny-portfolio-git
install -m 700 "$source_dir/github-sync.py" /opt/benny-portfolio/ops/github-sync.py
cat > /etc/systemd/system/benny-portfolio-sync.service <<'UNIT'
[Unit]
Description=Pull portfolio GitHub main and deploy its verified CI images to demos
After=network-online.target k3s.service
Wants=network-online.target
[Service]
Type=oneshot
Environment=GIT_TERMINAL_PROMPT=0
Environment=HOME=/var/lib/benny-portfolio-git
Environment=KUBECONFIG=/etc/rancher/k3s/k3s.yaml
ExecStart=/usr/bin/python3 /opt/benny-portfolio/ops/github-sync.py
TimeoutStartSec=20min
UMask=0077
Nice=15
IOSchedulingClass=idle
CPUQuota=30%
MemoryMax=512M
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
UNIT
cat > /etc/systemd/system/benny-portfolio-sync.timer <<'UNIT'
[Unit]
Description=Check portfolio GitHub main every two minutes
[Timer]
OnBootSec=90s
OnUnitInactiveSec=2min
RandomizedDelaySec=10s
Persistent=true
[Install]
WantedBy=timers.target
UNIT
systemctl daemon-reload
systemctl enable --now benny-portfolio-sync.timer
echo 'Portfolio GitHub sync timer enabled. Only fixed portfolio image updates are automated.'
