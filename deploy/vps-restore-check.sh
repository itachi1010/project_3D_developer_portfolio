#!/usr/bin/env bash
set -euo pipefail
backup="${1:?portfolio dump path required}"
case "$backup" in /var/backups/benny-portfolio/portfolio-*.dump) ;; *) exit 1 ;; esac
test -s "$backup"
database="portfolio_restore_check_$(date -u +%s)"
kubectl -n demos exec portfolio-db-0 -- createdb -U portfolio "$database"
cleanup() { kubectl -n demos exec portfolio-db-0 -- dropdb -U portfolio --if-exists "$database"; }
trap cleanup EXIT
kubectl -n demos exec -i portfolio-db-0 -- pg_restore -U portfolio --no-owner --no-acl --exit-on-error -d "$database" < "$backup"
count="$(kubectl -n demos exec portfolio-db-0 -- psql -U portfolio -d "$database" -Atc 'SELECT COUNT(*) FROM jobs')"
test "$count" -ge 3
echo "PASS: portfolio dump restored into an isolated temporary database ($count experience records)."
