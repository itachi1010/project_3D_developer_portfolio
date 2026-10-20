# Portfolio deployment and assistant handoff

Target domain: **bennyuchiha.tech**. Local validation is complete; the user
authorized VPS hosting on 19 October 2026. Current deployment evidence lives in
[assistant-handoff.json](assistant-handoff.json). It is a file-based handoff,
not a live chat bridge. Both assistants can read it if they can access the same
checkout; otherwise share the file or a Git commit. Keep secrets out of it.

## Existing VPS: answers for the other assistant

- Existing single-node K3s v1.35.9+k3s1 on 45.9.191.177, Ubuntu 26.04.1,
  2 vCPU, about 8 GiB physical RAM and 100 GB disk.
- Cresol Store is the primary workload in `cresol-store`, with priority 100000.
  Do not change its deployments, database, PVCs, Secrets, quotas or routing.
- The existing **demos** namespace is the lower-priority allocation, not a second
  Kubernetes cluster. It was empty at inspection on 19 October 2026. It uses
  `demos-priority` (1000), restricted Pod Security, 200m CPU/512Mi request ceilings,
  300m CPU/1Gi limit ceilings, and 10Gi requested storage. NodePort and extra
  LoadBalancer Services are forbidden. Use existing Traefik for public routing.
- Use a **separate portfolio PostgreSQL instance and credentials**, with its own
  2Gi PVC. Do not connect to the Cresol database.
- Admin login is required and now implemented. Every jobs write route checks
  server-side HTTP Basic credentials; the login form stores Authorization only
  in React memory. Refresh/sign-out clears it. A long random password is required;
  unset or short server credentials disable writes. Failed authentication is
  throttled in memory (single API replica). Public access MUST use HTTPS.
- Domain supplied by the user: `bennyuchiha.tech`. Its observed A record was
  **2.57.91.91**, not this VPS. Do not change DNS before reviewing current hosting.
- Recommended certificate: Let's Encrypt. The VPS ingress file is an **example**
  that references an existing `portfolio-tls` Secret. It does not obtain a
  certificate. DNS, certificate issuance and HTTP-to-HTTPS routing remain pending.

## Production design and budget

| Workload | CPU request / limit | Memory request / limit |
| --- | --- | --- |
| Nginx static frontend | 20m / 50m | 16Mi / 64Mi |
| Node API | 50m / 100m | 64Mi / 192Mi |
| PostgreSQL | 75m / 150m | 128Mi / 384Mi |
| Total | **145m / 300m** | **208Mi / 640Mi** |

These are initial allocations to validate, not promises about peak throughput.
All demo CPU limit allowance is used: other demos need a reviewed redistribution.
The 3D rendering runs in the visitor's browser; the server serves static assets.
Deployment strategy is **Recreate**, avoiding surge pods that exceed the quota,
at the cost of brief portfolio downtime during updates. No cluster infrastructure,
PriorityClasses or quotas are changed by the VPS overlay. Local bootstrap files
must NEVER be applied to the VPS.

All containers run non-root with capabilities dropped, no privilege escalation,
and read-only root filesystems. PostgreSQL data is writable only on its own PVC;
runtime temporary directories have separate ephemeral volumes. DB settings keep
the connection pool, shared buffers and connection count small. Local disks
survive pod replacement but do not survive loss of the server. Off-server backups
are still required. A 2Gi PVC is a requested capacity, not necessarily a hard disk
quota on K3s local-path storage; monitor actual disk usage.

Namespace boundaries, priorities, quotas and network policy reduce interference;
they do not guarantee no effect on a shared kernel, disk or network. Existing
VPS policy prevents demo access to store pods, but permits traffic among demos.

## Local production-image preview (Docker as a test runner)

From the portfolio repository:

```powershell
.\deploy\local.ps1 -Action Start
```

Open **http://localhost:8098**. This builds the real static frontend and Node
server, with a separate PostgreSQL volume and a loopback-only public port.
It does not use the old dev Dockerfile/Compose stack or touch its existing data.
`deploy/local.ps1` generates strong credentials in ignored `.env.production.local`.
Read that file locally to sign into Portfolio admin (`ADMIN_USERNAME` defaults
to `admin`). Never paste its values into chat or commit it. Changing a password
variable later does not automatically change an existing PostgreSQL role password.

```powershell
.\deploy\local.ps1 -Action Status
.\deploy\local.ps1 -Action Stop
node --test server/admin-auth.test.js
node deploy/smoke-test.mjs --restart-database
```

The original development commands and old database remain available. Existing
old database contents are **not** automatically copied into these previews.

## Local Kubernetes preview

The Kubernetes preview has its own `portfolio-local` k3d cluster, API port 6446,
and browser port **8099**. It leaves `cresol-local` unchanged. Docker runs the
local cluster's nodes; production K3s runs directly on the VPS.

After building with `deploy/local.ps1`, run:

```powershell
.\deploy\local-kubernetes.ps1 -ToolsDirectory 'D:\Documents\CODE\PYTHON\Django\Cresol_ecommerce_Store\.tools'
node deploy/smoke-test.mjs --base http://127.0.0.1:8099 --restart-database --kubernetes --kubectl 'D:\Documents\CODE\PYTHON\Django\Cresol_ecommerce_Store\.tools\kubectl.exe'
```

Alternatively put `k3d` and `kubectl` on PATH and omit the parameter. The tools
directory above reuses existing executables only, not Cresol's cluster credentials.
The script creates its own ignored `.local-deploy/kubeconfig.yaml`, explicitly
uses `k3d-portfolio-local`, and recreates the VPS quota and restricted security
profile **only inside this new local cluster**. Secrets are streamed over stdin,
not printed or committed. Existing Kubernetes Secrets are not overwritten.

Compose and Kubernetes previews have **different databases**. Only their initial
local credentials agree. Do not assume edits in one appear in the other.

## Application configuration

- Liveness: `/api/health`, independent of database health.
- Readiness: `/api/ready`, checks a database query.
- Frontend health: `/healthz`.
- Public jobs: `GET /api/jobs`; writes require the same admin Authorization
  validated by `GET /api/admin/session`.
- `DATABASE_URL`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` are server-only Secrets.
  A `JWT_SECRET` is unnecessary for this Basic auth implementation.
- `TRUST_PROXY=1` is for the trusted frontend proxy. Never expose the API service
  directly on the public internet. Configure ingress/client-IP trust separately
  before relying on original visitor IPs for security analytics.
- `VITE_APP_EMAILJS_SERVICE_ID`, `VITE_APP_EMAILJS_TEMPLATE_ID`,
  `VITE_APP_EMAILJS_PUBLIC_KEY`, `VITE_CONTACT_NAME`, `VITE_CONTACT_EMAIL` are
  **public build-time browser values**. They are not Kubernetes runtime secrets.
  Set them in `.env.production.local` and rebuild the frontend for direct delivery.
  Without EmailJS, the contact form opens a draft in the visitor's mail application.
  EmailJS template recipient
  and allowed domains must also be reviewed in EmailJS; no email was sent in tests.

## Before the VPS step

1. Review local tests, visual behaviour, real employment/project content, and
   contact form configuration. Audit dependency upgrades separately; the initial
   runtime audit found two moderate React Router findings.
2. Commit/push reviewed source and build/publish images off the two-core VPS.
   Replace placeholder image references in `deploy/kubernetes/vps/kustomization.yaml`
   with immutable release digests. Private packages need a **demos-scoped** pull
   Secret and `imagePullSecrets`; Cresol's credentials must not be reused implicitly.
3. Generate fresh server credentials privately; do not copy local test secrets.
   Create `portfolio-secrets` in demos with POSTGRES_PASSWORD, DATABASE_URL,
   ADMIN_USERNAME and ADMIN_PASSWORD. No committed `secret.yaml` should contain
   real values. Use a secure stdin/file-based admin procedure.
4. Validate the rendered VPS manifests against the real namespace quota and Pod
   Security admission. Stage application resources without public ingress first.
5. Decide whether to keep the old local database's jobs; transfer selected data
   explicitly after backup. Never restore into Cresol's DB.
6. Verify DB persistence, admin access, backup and restore, readiness and resource
   usage. Establish off-server database backups before storing important data.
7. Review existing domain hosting, point DNS, obtain valid TLS and configure
   HTTPS redirection. Then apply the separately staged ingress example. Add `www`
   only if DNS and the certificate cover it. No public HTTP admin credentials.

The deployment uses the existing VPS cluster and Traefik. It does not install
another cluster, cert-manager, CI runners, or a monitoring stack.

## Single-node VPS release procedure

`deploy/vps-deploy.py` builds the production images on the PC, creates a release
source archive excluding ignored/private files, records image IDs and archive
SHA-256 hashes, uploads over pinned-host SSH, and imports images into K3s.
Versioned image tags are available locally on this single node, so a registry
account is not required for this path. A replacement/new node needs an explicit
image import or a registry deployment. Source archives and image archives stay
under `/opt/benny-portfolio/releases/<release>/`; source is not a GitHub push.

Run with Python 3.11+ from the portfolio directory, supplying the previously
verified known-hosts file and local kubectl executable:

```powershell
python deploy/vps-deploy.py --known-hosts '<verified-known-hosts-file>' --kubectl '<kubectl.exe>'
```

For a presentation-only update, add `--frontend-only` to preserve the deployed
API image. If the Docker VM is slow at compiling Vite, `--prebuilt-frontend`
builds Vite on the PC first and packages only that output into the same non-root
Nginx runtime. The latter option requires `--frontend-only`; no server build or
dependency installation is performed on the VPS.

The script targets only `root@45.9.191.177` and namespace `demos`. It generates
fresh server credentials under root-only `/etc/benny-portfolio/credentials.json`
and creates only `portfolio-secrets`; existing credentials are preserved. It
starts the separate PostgreSQL StatefulSet first and waits for application
readiness. It never applies local bootstrap resources or changes Cresol routing.

`deploy/vps-web.py`, run on the VPS, configures only portfolio-hostname routing,
an HTTP-to-HTTPS redirect and a separate HTTP-01 path. It mounts the challenge
ConfigMap through a portfolio-specific Nginx configuration without adding Pods.
The TLS Secret must be issued before public HTTPS is ready. The initial release
may run this script separately after the app becomes healthy.

Certificate tooling lives in a dedicated Python environment under
`/opt/benny-portfolio/acme`. `deploy/vps-issue-tls.sh` first verifies that the
public hostname serves the portfolio challenge, then obtains a Let's Encrypt
certificate and installs it into `demos/portfolio-tls`. The ACME account,
certificate keys, state and logs use portfolio-specific directories. No private
key or credentials are printed by the helpers.

`deploy/vps-maintenance.sh` installs two narrowly scoped systemd timers:
daily custom-format PostgreSQL dumps (14-day retention) and twice-daily
certificate renewal checks. Dumps are validated with `pg_restore --list`.
`deploy/vps-restore-check.sh` restores into its own temporary database, checks
the experience records and removes that test database. Download copies over SSH
to a protected off-server location; a server-only dump cannot cover server loss.

Public domain migration is user-operated. See [CLOUDFLARE.md](CLOUDFLARE.md).
Use DNS only during initial testing, then enable the proxy and Full (strict)
after the origin certificate is valid. Each future project needs its own
hostname route, credentials and reviewed resource allocation.

## Validation completed on 19 October 2026

- Production frontend/API images built; Compose reports all three containers healthy.
- Admin credential checks and failed-login throttling unit test passed.
- API integration checks passed in both previews: public reads, authenticated
  create/update/delete, rejected anonymous writes, liveness and DB readiness.
- A temporary job survived a Compose DB restart and a Kubernetes DB pod
  replacement. Test rows were removed afterward. Compose readiness returned
  503 during the DB outage, while API liveness remained healthy.
- Chrome checks passed for admin sign-in/sign-out and rendered desktop/mobile
  views with no JavaScript page errors. Screenshots are under ignored
  `.local-deploy/portfolio-desktop.png` and `portfolio-mobile.png`.
- All three Kubernetes pods are ready under restricted Pod Security. Quota use
  is 145m requested CPU, 300m CPU limits, 208Mi requested RAM, 640Mi RAM limits,
  three pods, three internal Services and one bound 2Gi PVC. A server dry-run
  rejected a further pod exceeding the CPU budget; nothing was created.
- A repeat local deployment succeeded and preserved credentials and data.
- Local K3s uses **v1.35.9+k3s1**, matching the VPS. The first empty portfolio
  test cluster using v1.35.2 failed repeatedly during control-plane RBAC startup;
  only that new test cluster was replaced. Existing Cresol clusters were not changed.
- Idle Compose memory sample: frontend 12.84MiB, API 26.93MiB, PostgreSQL 20.59MiB.
  This is a brief sample, not a load-test result or guaranteed peak requirement.
- No source was pushed and no portfolio resources, DNS or configuration were
  changed on the VPS. A read-only check confirmed Cresol's four pods remain ready
  and the VPS demos namespace remains empty.

Personalization is complete: verified resume details, six categorized projects,
the published KekeDrop screenshots mapped onto a licensed 3D phone, and a public
resume download. Cresol employment starts in May 2024, as confirmed by the user.
The ERP preview uses visibly labelled synthetic data. Chrome checks passed at
desktop and mobile widths, including app/screenshot switching, project filters,
navigation and a no-WebGL fallback. Both local previews serve the updated content.
Experience initialization passed repeat-run and custom-record preservation checks.

Remaining public-launch work: optional EmailJS configuration, dependency review,
image publication and pull
credentials, fresh VPS secrets, database backup/restore, domain/DNS and valid TLS.

References: [Kubernetes quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/),
[restricted Pod Security](https://kubernetes.io/docs/concepts/security/pod-security-standards/),
[Vite public environment variables](https://vite.dev/guide/env-and-mode),
[separate Codex worktrees](https://learn.chatgpt.com/docs/environments/git-worktrees).
