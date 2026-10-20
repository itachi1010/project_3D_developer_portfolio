# Benedict Chuks-Onah portfolio: explanation and continuation handoff

Prepared 20 October 2026 (Africa/Lagos). This describes work already completed,
how access and deployment work, and what another agent needs to continue.
Read [../AGENTS.md](../AGENTS.md) for operating rules and
[assistant-handoff.json](assistant-handoff.json) for shared coordination/history.
Historical messages in the JSON describe their date, not necessarily current state.

## Current position

The portfolio is live at **https://www.bennyuchiha.tech** and
**https://bennyuchiha.tech**, on your existing Kubernetes VPS `45.9.191.177`.
It has its own frontend, API, PostgreSQL database and persistent storage. Your
main Cresol Store runs separately and its resources were not changed for this work.

Production now follows **PC edits → Git commit → push main → GitHub Actions
tests/builds → VPS downloads the matching release → Kubernetes updates**.
Your PC and SSH tunnel can be off after a successful push. Saving a file alone
does not publish it. The initial release used a different method, explained below.

Repository: https://github.com/itachi1010/project_3D_developer_portfolio

Local folder: `D:\Documents\CODE\javascript\3js\project_3D_developer_portfolio`.
At the start of this documentation work, local/main, GitHub/main and VPS state
matched `e63ef66b09c57f796a6c21359a1d1433240f43c9`, deployed at
`2026-10-20T09:10:53Z`. This is a dated snapshot, not a permanent latest commit.
Use https://www.bennyuchiha.tech/release.json and the VPS status file to determine
what is actually running after subsequent pushes, including this handoff.

## What changed on the website

The tutorial portfolio was personalized using your resumes, project sources,
published app listings and explicit corrections. The name is **Benedict
Chuks-Onah**, based in Kano, Nigeria. Your Cresol role starts **May 2024**, which
you confirmed; conflicting resume dates do not override that answer. Education
and other experience were replaced with your actual details. Fake tutorial
employers, testimonials and identity text were removed. Navigation, footer,
page metadata and the curated public resume use your identity.

Your original `D:\Pictures\profile_pics\Benedict.jpeg` was copied to
`public/images/benedict-chuks-onah.jpeg`. It is presented at the top in a framed
portrait with an introduction, subtle reveal/float/halo animation and responsive
layout. Reduced-motion preferences disable animation. The portrait replaced the
opening workstation scene; older model assets remain with their attribution.
The photograph itself was not AI edited.

There are six projects, with filters for complete products, web, mobile,
backend, frontend and UI/UX. Descriptions distinguish your contribution:

| Project | Presentation and contribution |
| --- | --- |
| Cresol ERP | Django/Postgres manufacturing, inventory, finance, HR, reports and mobile APIs; your engineering work. Source reviewed in `D:\Documents\CODE\PYTHON\Django\combined_inventory_management`; no real business records were published. |
| KekeDrop | Passenger and driver apps, mobile/backend/admin/payment work; real Play Store links and official screenshots on a Three.js phone. |
| Cresol Store | Next.js/Django/Flutter commerce work; described as private staging rather than claiming an unverified public launch. |
| TrackMeNG | Your backend and frontend contributions, with collaborative UI/UX credit; formerly published app, later removed by the startup. |
| Waffles Runner | Unity WebGL/React Telegram mini-app/Python game and referral work, collaborative design credit; public itch.io link. |
| BLOP | Collaborative UI/UX budgeting-app work, without claiming sole full application engineering. |

The KekeDrop model is the real **Quaternius Phone, CC0**, obtained from
https://poly.pizza/m/k2kgBepoMU, with license in `public/models/phone/`.
Official screenshots are textures on a plane aligned to the phone front.
Passenger/driver buttons and screenshot selectors change the screen; Play links
open the corresponding listing:

- Passenger: https://play.google.com/store/apps/details?id=com.kekedrop.user
- Driver: https://play.google.com/store/apps/details?id=com.kekedrop.rider

The 3D canvas loads near the viewport, uses demand rendering and caps pixel
density. A static fallback handles unavailable WebGL. The ERP preview is a real
template rendered with synthetic demo values and a fake user; it is labelled.
Other unavailable product screens use labelled illustrations. Asset provenance
and licenses are in [PROFILE_SOURCES.md](PROFILE_SOURCES.md) and
`public/credits.html`.

Your resumes were reviewed privately from `D:\Documents\resume.rar`; raw resumes
and extraction files were not published. The selected public one-page PDF is
`public/Benedict-Onah-Resume.pdf`. Private media/PDF helper scripts under
`.local-deploy/` are PC-only and are not available in a fresh Git clone.

Contact links point to your email, GitHub, LinkedIn and resume. EmailJS is not
configured: the form opens the visitor's email draft and does not claim that a
message was delivered. No test emails were sent.

## Application and security work

Frontend: React 18, Vite 4 and Three.js. API: Node 22/Express with `pg`.
Database: PostgreSQL 15. The API stores editable experience entries; most
project/profile content is still maintained in source files.

| File | Purpose |
| --- | --- |
| `src/data/profile.js` | Identity, projects, categories and skills |
| `shared/experience.json` | Verified default experience and frontend fallback |
| `src/components/Hero.jsx`, `src/portfolio.css` | Portrait, introduction and styling |
| `src/components/MobileShowcase.jsx` | Phone, screenshot textures and app controls |
| `server/db.js` | Database setup and safe legacy seed replacement |
| `server/admin-auth.js`, `server/index.js` | Server authentication, API and health behavior |
| `deploy/Dockerfile.*`, `deploy/kubernetes/` | Production images and reviewed Kubernetes resources |
| `.github/workflows/deploy.yml` | GitHub tests, builds and release publication |
| `deploy/github-sync.py` | Source of the fixed VPS deployment agent |

Default experience replacement is transactional/idempotent and preserves custom
or edited records. **Changing `shared/experience.json` does not overwrite existing
live database rows.** Use authenticated admin or a reviewed, backed-up migration
when an existing production record needs to change.

The admin UI opens with `/?admin=1`. Every mutation and admin-session check is
protected server-side with HTTP Basic authentication over HTTPS. Weak/unset
credentials disable writes; generated production credentials meet the minimum
length. Authentication includes constant-time checking and failed-attempt
throttling. The UI keeps credentials in memory, not persistent browser storage.
API connections/timeouts and Node memory are bounded, shutdown is graceful, and
liveness is separate from database readiness. The internal API is not exposed
with a public service of its own. Browser-forwarded headers are overwritten by
Nginx; trustworthy original visitor IP analytics need a separately reviewed
Cloudflare/ingress proxy chain, not blind trust of client headers.

## Where it runs and why it does not take over Cresol

This is **one existing single-node K3s cluster**, not multiple independent
Kubernetes installations. Verified on 20 October: node `cresol-vps`, hostname
`srv2055794`, Ubuntu 26.04.1 LTS, K3s `v1.35.9+k3s1`, containerd `2.2.7-k3s1`,
approximately 2 vCPU / 8 GiB RAM / 100 GB disk.

Main Cresol uses namespace `cresol-store`, priority 100000. Portfolio uses
existing namespace `demos`, priority 1000. Hostname-specific Traefik ingress
routes the portfolio domains to its service. Other projects can have separate
hostname routes without sharing application databases, but capacity must be reviewed.

| Portfolio workload | CPU request / limit | Memory request / limit |
| --- | --- | --- |
| `portfolio-web` | 20m / 50m | 16Mi / 64Mi |
| `portfolio-api` | 50m / 100m | 64Mi / 192Mi |
| `portfolio-db` | 75m / 150m | 128Mi / 384Mi |
| Total | 145m / 300m | 208Mi / 640Mi |

The existing demos quota is 200m CPU requests, 300m CPU limits, 512Mi requested
memory, 1Gi memory limits and 10Gi storage. Portfolio consumes the entire CPU
limit budget. Do not add another workload or increase limits without review.
Each workload has one replica; API/web updates use Recreate to fit the budget,
so updates can briefly interrupt service. Restricted Pod security, non-root
users, dropped capabilities and restricted filesystem/token access were configured.
Namespaces/priority/quotas help protect Cresol, but the kernel, disk and network
are shared. This is not high availability or a sandbox for hostile applications.

The database has its own `data-portfolio-db-0` PVC: 2Gi, local-path, RWO.
It survives replacement of its Pod. Deleting that PVC is destructive. The
portfolio DB/user and credentials are separate from Cresol. Local Compose,
local Kubernetes and VPS databases are independent; there is no replication
or automatic synchronization between these previews and production.

## How SSH access works

SSH uses your existing private key on this PC to prove possession of the key
whose public counterpart is authorized on the VPS. The private key was not
uploaded to GitHub or the VPS. SSH encrypts the connection; a local SSH agent
can sign authentication challenges for a loaded key.

- Server/user: `root@45.9.191.177`.
- Local identity reference: `C:\Users\Benny\.ssh\cresol_vps`.
- Verified server Ed25519 fingerprint:
  `SHA256:ux7GbId7YEjk/WkvlX59qmX/6y08+xwgFSvYb/GgLLI`.
- This fingerprint was independently checked against the Hostinger console.
- Portfolio wrapper: `deploy/ssh-vps.ps1`.
- Its ignored public known-host record: `.local-deploy/vps-private/known-hosts`.
- Original connection wrapper, still available:
  `D:\Documents\CODE\PYTHON\Django\Cresol_ecommerce_Store\deploy\kubernetes\vps\ssh.ps1`.
- Original verified public record:
  `D:\Documents\CODE\PYTHON\Django\Cresol_ecommerce_Store\.k8s-local\vps-known-hosts`.

From a PowerShell terminal in this portfolio:

```powershell
.\deploy\ssh-vps.ps1 -Command 'kubectl -n demos get pods,pvc,ingress'
.\deploy\ssh-vps.ps1 -Command 'python3 /opt/benny-portfolio/ops/github-sync.py --status'
.\deploy\ssh-vps.ps1 -Command 'journalctl -u benny-portfolio-sync.service -n 40 --no-pager'
```

The wrapper enables strict host-key checking, verifies the pinned fingerprint,
uses the specific identity and disables interactive password prompts. Commands
are UTF-8/base64 encoded to preserve Windows/Linux quoting and run with Bash
error checking. **Base64 is not encryption**; do not use command arguments to
transport passwords or other secrets.

A fresh Git clone does not contain the key or known-host file. On this PC,
the independently verified public record can be copied from the original path
above into the ignored portfolio path. Alternatively pass `-KnownHosts` with
that existing record. Do not copy a private key into this repository. On another
PC, provision authorized SSH access securely and independently verify the host
fingerprint. If the key needs unlocking, run `ssh-add` interactively yourself;
do not expose its contents/passphrase. Never fix SSH errors by disabling host
checking. A changed fingerprint requires independent investigation.

Root access was used for the specifically authorized portfolio setup. It does
not mean another agent may modify Cresol or unrelated services. Read-only
inspection should precede any operational change.

## How the code originally reached the VPS without a Git push

Initially the production images were built from local PC files. Docker images,
source archives, rendered manifests and SHA-256 checksums were transferred over
SSH/SCP, imported into K3s containerd and applied only to the portfolio resources.
This works without a Git commit: a container image can contain files that only
exist on your PC. VS Code correctly showed those files as modified/untracked.
A running release and a pushed Git history are different things.

Manual releases were `20261019T141935Z` (initial API/web) and
`20261019T162457Z` (portrait frontend). Their archives are under
`/opt/benny-portfolio/releases/<release>/`. A stalled local Docker frontend
compile was cancelled; the portrait frontend was built with Vite on the PC and
packaged into the same non-root Nginx runtime. No Cresol resources were changed.
`/opt/benny-portfolio/current` is the **last manual release pointer**, not the
current Git deployment pointer.

You then requested GitHub as the normal deployment route. The personalized
site, infrastructure source and automation were committed/pushed in `de85ec9`,
followed by documentation in `e63ef66`. Both completed real GitHub builds and
automatic VPS deployments. These are not still unpushed local changes.

## How GitHub automatic deployment works now

1. Push `main` to your public GitHub repository. CI runs on GitHub, not your PC/VPS.
2. The workflow runs `npm ci`, application tests, deployment-agent tests and the
   Vite production build. It embeds the exact commit in `dist/release.json`.
3. CI builds API and frontend images tagged `git-<40-character commit>`, packages
   them in `images.tar.gz`, and publishes metadata and SHA-256 checksums in a
   matching `portfolio-<commit>` GitHub Release. A release stays draft until its
   assets are uploaded. Published reruns retain the existing release.
4. A fixed root-owned VPS sync agent polls main about two minutes after its
   previous run finishes, with a small random delay. It pulls source via HTTPS
   and waits for the matching completed release. No GitHub password is required
   while the repository/releases are public.
5. The agent validates repository/commit, archive checksums, exact permitted image
   names and imported image IDs. It rechecks main before rollout, imports images
   into K3s, backs up the portfolio DB, and changes only the API/web image fields.
6. It waits for ready workloads and checks API readiness and the exact frontend
   commit through the internal service. Success updates the status file. Failed
   image rollouts restore the prior images; database changes are not reversed.

The workflow uses GitHub's built-in repository token to publish releases.
No VPS private key, kubeconfig, admin password, database password or Cloudflare
token is stored in GitHub. There is no external image-registry account and no
self-hosted Actions runner. CI publishes container archives to GitHub Releases.

| VPS path / unit | Purpose |
| --- | --- |
| `/opt/benny-portfolio/ops/github-sync.py` | Installed, reviewed root-owned sync agent |
| `/var/lib/benny-portfolio-git/source` | Actual GitHub source checkout |
| `/var/lib/benny-portfolio-git/status.json` | Last successful deployment evidence |
| `/var/lib/benny-portfolio-git/releases/<commit>` | Downloaded release cache; keeps three |
| `benny-portfolio-sync.service`, `.timer` | Serialized deployment check, enabled at boot |
| `/opt/benny-portfolio/git-bootstrap/source` | Historical initial agent bootstrap checkout |

Sync is capped at 30% CPU / 512MiB memory, low CPU/IO priority, with process
hardening. It does not run arbitrary scripts from the repository as root or
apply arbitrary manifests. **Editing the agent/installer in Git does not replace
the installed host agent.** Host infrastructure/agent updates require explicit
reviewed installation. Schema changes need their own compatibility/backup review.

Everyday commands and troubleshooting are in
[GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md). Start with:

```powershell
git status --short --branch
# Review the diff and stage only intended files before committing.
git add <files-you-reviewed>
git commit -m "Describe the change"
git push origin main
curl.exe --fail --silent --show-error https://www.bennyuchiha.tech/release.json
```

A green Actions run means the image release is available, not necessarily live
yet. Compare the public marker with GitHub/main after the VPS rollout completes.
First verified run: https://github.com/itachi1010/project_3D_developer_portfolio/actions/runs/39397669156.
Second verified run: https://github.com/itachi1010/project_3D_developer_portfolio/actions/runs/39398364229.

For operational recovery, the following are VPS commands, normally executed
through the SSH wrapper. Inspect status/logs before retrying:

```bash
python3 /opt/benny-portfolio/ops/github-sync.py --status
systemctl status benny-portfolio-sync.timer
journalctl -u benny-portfolio-sync.service -n 50 --no-pager
kubectl -n demos get pods,pvc,ingress
kubectl -n demos logs deployment/portfolio-api --tail=50
```

`systemctl start benny-portfolio-sync.service` checks immediately.
`python3 /opt/benny-portfolio/ops/github-sync.py --retry` explicitly retries a
failed same commit after its cause is fixed; otherwise push a fix. Stop/start
only `benny-portfolio-sync.timer` when intentionally pausing/resuming portfolio
automation. Never delete the DB/PVC as a release troubleshooting step.

## DNS, Cloudflare, HTTPS and maintenance

Your domain remains registered with Hostinger. Cloudflare nameservers
`ram.ns.cloudflare.com` and `sasha.ns.cloudflare.com` are authoritative. The
root A record targets `45.9.191.177`, `www` aliases the root, and proxying is
enabled. Public DNS therefore returns Cloudflare edge IPs, not the origin IP.
The old Hostinger parking address `2.57.91.91` was a historical stale-cache issue;
do not assume it persists without a fresh check.

You confirmed **Full (strict)** SSL mode. The VPS has a Let's Encrypt certificate
covering both names in Secret `demos/portfolio-tls`; the original certificate
expires 17 January 2027. Check current expiry rather than relying on this date
after renewal. Traefik routes each hostname to the correct portfolio service;
HTTP redirects to HTTPS except the HTTP-01 validation path. Adding other domains
requires their own reviewed routes, certificates and application capacity.

Certificate state is `/etc/benny-portfolio/letsencrypt`; Certbot environment is
`/opt/benny-portfolio/acme`. Reviewed hooks live in `/opt/benny-portfolio/ops`.
HTTP-01 hooks preserve simultaneous apex/www tokens in the portfolio ConfigMap
and refresh only portfolio web. The staging renewal dry-run passed for both names.

| Timer | Schedule and limit |
| --- | --- |
| `benny-portfolio-renew.timer` | 02:15 and 14:15 UTC (03:15/15:15 Lagos), up to 30 minutes jitter; service 20% CPU / 256MiB |
| `benny-portfolio-backup.timer` | 03:35 UTC (04:35 Lagos), up to 15 minutes jitter; service 15% CPU / 128MiB |
| `benny-portfolio-sync.timer` | 90 seconds after boot; then two minutes after prior check, plus small jitter; 30% CPU / 512MiB |

All three were enabled/active at this handoff inspection. Dumps are custom-format
under `/var/backups/benny-portfolio`, retained 14 days. A restore into a separate
temporary test database passed; that database was removed. One off-server dump
was downloaded privately and its SHA-256 matched. **Recurring off-server backups
are still not configured.** A local-path PVC and a backup on the same VPS do
not protect against loss of the entire server.

Credential locations below are references, never instructions to print them:

- PC admin credentials: ignored `.local-deploy/vps-private/admin.json`.
- VPS generated credentials: root-only `/etc/benny-portfolio/credentials.json`.
- Kubernetes application Secret: `demos/portfolio-secrets`.
- One private downloaded dump: `.local-deploy/vps-backups/portfolio-20261019T143200Z.dump`.

Do not include secret values in screenshots, handoffs, logs or Git. Do not run
secret-dumping commands when collecting diagnostics for another chat.

## Local testing and evidence

Production-like Compose preview: `.\deploy\local.ps1 -Action Start`, port8098;
use `-Action Status` or `Stop` to manage it. The separate local K3d preview is
port8099 via `deploy/local-kubernetes.ps1`, with instructions in
[DEPLOYMENT.md](DEPLOYMENT.md). It reuses only local tool binaries from Cresol's
`.tools` folder, not the Cresol cluster/database. Production credentials differ.

Port8100 was a private SSH-tunnel preview of the VPS while the tunnel runs;
it is not required for public access. Closing it does not stop the website.
Temporary local media, browser QA, keys/settings and backup files under
`.local-deploy/` are not cloned by another agent and are not required by CI.

Completed verification included:

- Application authentication tests, production build, five deployment-agent
  validation/rollback tests and workflow linting.
- Responsive browser checks at desktop/tablet/mobile widths, portrait, project
  filters, passenger/driver and screenshot selection, navigation, no-WebGL
  fallback and no page errors.
- Authenticated create/update/delete, rejection of unauthenticated writes,
  preserved custom experience and repeat migration safety.
- Portfolio DB record persistence across DB Pod recreation; dump restore and
  private off-server hash verification.
- Public HTTPS on both names, original certificate installation, renewal
  staging simulation, exact Git commit markers and successful automatic rollouts.
- Three portfolio pods ready, own 2Gi PVC bound; four existing Cresol pods ready
  with unchanged identities/restart counts during deployment checks.

For future application changes run `npm test` and `npm run build`; for sync
changes run `python -m unittest discover -s deploy -p test_github_sync.py -v`.
The current PC also has a usable Python interpreter in Cresol's backend venv;
this is a tool dependency only. A historical build emitted nonblocking large
chunk/Three dependency warnings, and a prior audit flagged moderate React Router
advisories. Review current advisories separately rather than asserting they are fixed.

## What the next agent should do

Read root `AGENTS.md`, this file, the JSON handoff and current Git diff. Confirm
the current request and file ownership. For a production change, inspect the
live marker and read-only VPS state before acting. Update the shared handoff
with completed actions, evidence and unresolved issues after work, without secrets.

Remaining optional work is recurring off-server backups, dependency review,
EmailJS if you want direct delivery, and capacity planning before other projects.
No SIEM or visitor/VPN analytics system was installed by the work documented
here. A VPN exit IP alone does not prove a visitor's identity or VPN use.

Separate ChatGPT/Claude conversations do not automatically exchange messages.
They can coordinate through these files when they have filesystem/repository
access, or you can paste the handoff into the other chat. Keep one editor per
file and use Git commits as the shared version history. `CLAUDE.md` points to
the same agent instructions so the two tools do not maintain competing runbooks.

## Optional background music (20 October 2026)

`src/components/BackgroundMusic.jsx` adds a compact fixed play/pause control
with a volume/settings panel. Music is off on every page load; only the volume
preference is remembered. The audio source is assigned after a deliberate click,
so there is no initial audio download. Admin view excludes the control.

The locally hosted `public/audio/gymnopedie-no-1.mp3` is Satie's Gymnop?die No. 1,
recording credited to Teknopazzo and dedicated CC0 on Wikimedia Commons.
See `public/audio/LICENSE.md` for source URL, license and checksum, and
`public/credits.html` for visitor-facing credit. Default volume is 15%, playback
loops, and errors show a retry message. No external audio streaming service,
new dependency, database change or VPS resource change is involved.

Application tests/build passed. Actual Chrome playback/decode, pause, silent
reload, deferred download, volume persistence, responsive settings panel and
failed-download feedback were checked. Private repeatable browser QA on this PC
is `.local-deploy/test-music.cjs`; it is ignored, not part of a fresh clone.
