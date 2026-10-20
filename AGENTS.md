# Portfolio agent instructions

This repository is Benedict Chuks-Onah's live portfolio. Read these instructions
before editing, then read `docs/PORTFOLIO_HANDOFF.md` and
`docs/assistant-handoff.json`. `docs/GITHUB_DEPLOYMENT.md` describes normal releases.
These files are shared handoffs, not a live connection between AI chat sessions.

## Start each session

1. Read the current user request and run `git status --short --branch` and
   `git log -3 --oneline`. Preserve other people's changes; inspect the diff.
2. Check the JSON handoff for current ownership before editing overlapping files.
   Record your scope there and release ownership when finished.
3. Recheck live state when needed: `https://www.bennyuchiha.tech/release.json`
   identifies the deployed commit. A historical document snapshot is not proof
   of today's deployment.
4. Update handoff evidence and outstanding work when you finish. Never describe
   planned work as complete or a green CI build as already deployed.

## Scope and safety

- The main project on this VPS is Cresol Store. Do not edit its namespace
  `cresol-store`, database, storage, credentials, routing, quota or priorities.
- Portfolio runs in existing namespace `demos` on a single-node K3s VPS
  `45.9.191.177`. This is not a second cluster or a separate VPS.
- Do not apply local bootstrap manifests to production, increase quotas, add a
  LoadBalancer/NodePort or add surge replicas as a routine release.
- Portfolio already uses the namespace's entire 300m CPU limit. Review capacity
  before adding workloads. Its deployments use Recreate; updates can briefly interrupt service.
- Never commit or print private keys, tokens, passwords, kubeconfigs, database
  dumps, raw resumes or credential-bearing URLs. `.local-deploy/` is private and ignored.
- User has authorized portfolio SSH administration and GitHub automatic releases.
  Routine authorized implementation/testing does not require repeated approval.
  Follow the latest user scope; deleting data or changing unrelated services is not implied.
- Do not send email/messages or invent project achievements. Use synthetic data
  for screenshots. Preserve attribution and distinguish collaborative contributions.

## Website facts and file map

- Display name: **Benedict Chuks-Onah**. Cresol role starts **May 2024** (user confirmed).
- Identity/projects/skills: `src/data/profile.js`; experience defaults:
  `shared/experience.json`; hero: `src/components/Hero.jsx`; CSS: `src/portfolio.css`.
- Mobile model/screenshots: `src/components/MobileShowcase.jsx`,
  `public/models/phone/`, `public/projects/kekedrop/`.
- Photo: `public/images/benedict-chuks-onah.jpeg`; public curated resume:
  `public/Benedict-Onah-Resume.pdf`; provenance: `docs/PROFILE_SOURCES.md`,
  `public/credits.html`.
- Express/Postgres: `server/`; migrations/default seeding: `server/db.js`.
  Existing database experience rows override frontend defaults. Editing the JSON
  alone does not update existing live rows; use authenticated admin or a reviewed migration.
- Admin: `/?admin=1`; server checks credentials for every write. Never move
  credentials into browser build variables or persistent browser storage.
- Contact currently uses a visitor mail draft; EmailJS delivery is not configured.
- Production Dockerfiles, manifests and tools are in `deploy/`. Root Compose and
  Dockerfile are legacy development files, not the current production release path.

## Test and release

- For application changes: `npm test`, `npm run build`; deployment-agent changes:
  `python -m unittest discover -s deploy -p test_github_sync.py -v`.
  Use a Python interpreter available on the machine. Check responsive/browser
  behavior when changing the interface. Do not add tests that only restate docs.
- Local production preview: `.\deploy\local.ps1 -Action Start` on port 8098.
  Local K3d preview uses port 8099; see `docs/DEPLOYMENT.md`. Both databases are
  separate from production; no automatic database synchronization exists.
- Normal release: review/stage intended changes, commit, push `main`. GitHub
  Actions tests/builds and publishes `portfolio-<commit>` release images. The VPS
  fixed sync agent polls GitHub and updates only portfolio API/web deployments.
- Saving files alone does not deploy. A green Actions run means images are ready;
  confirm public `release.json` and API readiness after the VPS finishes.
- No routine image copy from PC or manual kubectl apply is needed. Host-agent,
  infrastructure, certificates and schema/restore changes require separately
  reviewed operations; pushing those source files does not install host changes.
- Automatic rollback restores preceding images, not database contents.

## SSH and operational access

From this repo, use `.\deploy\ssh-vps.ps1 -Command 'kubectl -n demos get pods'`.
The wrapper requires the existing local private identity and independently
verified known-host record; see the handoff for paths and bootstrapping.
Do not disable host-key checking or read the private key to troubleshoot.

Credentials are referenced by path only in the handoff. Root access does not
authorize modifying Cresol. Start with read-only diagnostics. Review logs for
secrets before quoting them. Preserve production DB/PVC during image releases.

## Remaining work

Recurring off-server backups are not configured; one private off-server dump was
validated. EmailJS is optional and unconfigured. Review dependency advisories
separately. No further project fits the current demos CPU budget without review.
See the handoff for recovery commands, maintenance timers and verified evidence.
