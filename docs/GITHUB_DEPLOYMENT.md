# GitHub-based production deployment

Repository: https://github.com/itachi1010/project_3D_developer_portfolio

The normal path is:

**PC edits → commit → push main → GitHub Actions tests/builds → VPS pulls GitHub → Kubernetes update.**

## Everyday use

In VS Code Source Control, review your changes, stage them, enter a commit
message, select **Commit**, then **Sync Changes / Push**. Saving a file alone
does not publish it. The equivalent terminal commands, from this repository, are:

```powershell
git add .
git commit -m "Describe the change"
git push origin main
```

Check the [Actions page](https://github.com/itachi1010/project_3D_developer_portfolio/actions).
Each main commit runs backend and deployment validation tests, builds the website,
and packages versioned API/frontend images. Only a completed build publishes
the matching `portfolio-<commit>` GitHub Release. Failed builds keep the current
website running. Rerunning a published commit retains its existing release.

The VPS checks main every two minutes after its previous sync finishes. It pulls
the source into `/var/lib/benny-portfolio-git/source`, downloads only the matching
published release, verifies checksums/image names/image IDs and backs up the
portfolio database. It updates only the portfolio API and frontend images in
`demos`. Health and exact frontend commit checks must pass before success is
recorded. Failed image rollouts restore the preceding images; database changes
are not automatically undone. Review schema changes separately.

Builds run on GitHub, not the VPS. The existing persistent PostgreSQL instance,
credentials, TLS certificate, resource limits and Cresol workloads are preserved.
Infrastructure changes, host-agent upgrades and database restoration remain
explicit operations; arbitrary repository scripts are not run as root by sync.

## Verify which commit is live

Open https://www.bennyuchiha.tech/release.json and compare `commit` with GitHub's
latest main commit. A green build means the release is available; allow the VPS
polling and rollout time before expecting that commit on the live website.

On the VPS:

```bash
python3 /opt/benny-portfolio/ops/github-sync.py --status
systemctl status benny-portfolio-sync.timer
journalctl -u benny-portfolio-sync.service -n 50 --no-pager
```

To check immediately: `systemctl start benny-portfolio-sync.service`.
To pause auto deployment: `systemctl stop benny-portfolio-sync.timer`.
To resume: `systemctl start benny-portfolio-sync.timer`.
After fixing a failed rollout, retry that same commit explicitly with
`python3 /opt/benny-portfolio/ops/github-sync.py --retry`; otherwise push a fix.

## Credentials and scope

The public GitHub repository/release downloads require no VPS GitHub password.
Actions uses its built-in, repository-scoped token to publish the release.
No VPS SSH key, kubeconfig, admin password, database password or Cloudflare token
is stored in GitHub. Real local settings, raw resumes, private backups and browser
test files remain ignored. Keep this repository public for this unauthenticated
pull setup; private-repository deployment needs separately configured read access.

`deploy/github-sync.py` is installed as a fixed root-owned agent, with a serialized
systemd timer, CPU/memory caps and no application builds on the VPS. It does not
apply arbitrary manifests or run code from its checkout on the host. CI container
images execute only in the existing restricted portfolio Pods. Agent changes
in GitHub require explicit installation by an administrator.
