#!/usr/bin/env bash
set -euo pipefail
umask 077
exec 9>/var/lock/benny-portfolio-backup.lock
flock -n 9 || exit 0
directory=/var/backups/benny-portfolio
install -d -m 700 "$directory"
destination="$directory/portfolio-$(date -u +%Y%m%dT%H%M%SZ).dump"
temporary="$(mktemp "$directory/.backup-XXXXXX")"
trap 'rm -f -- "$temporary"' EXIT
kubectl -n demos exec portfolio-db-0 -- pg_dump -U portfolio -d portfolio --format=custom > "$temporary"
test -s "$temporary"
kubectl -n demos exec -i portfolio-db-0 -- pg_restore --list < "$temporary" >/dev/null
mv -- "$temporary" "$destination"
chmod 600 "$destination"
echo "Portfolio backup validated: $destination"
# Retain two weeks of this project's dumps, without traversing other directories.
find "$directory" -maxdepth 1 -type f -name 'portfolio-????????T??????Z.dump' -mtime +14 -delete
