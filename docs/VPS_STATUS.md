# Portfolio VPS status — 19 October 2026

The personalized portfolio is deployed on `45.9.191.177`, in the existing K3s
`demos` namespace. Production now uses **GitHub-based automatic deployments**, validated on 20 October 2026. The first verified Git deployment was `de85ec9cdf3b97bad274919b83c41460e9653e8c`. The current deployed commit is available at https://www.bennyuchiha.tech/release.json. Earlier manual frontend/API releases remain archived.
Source and image archives, image IDs, rendered manifests and validated SHA-256
checksums are under `/opt/benny-portfolio/releases/<release>/`.
The legacy symlink `/opt/benny-portfolio/current` identifies the last manual release. For current Git deployments, use `/var/lib/benny-portfolio-git/status.json`; source pulled from GitHub is under `/var/lib/benny-portfolio-git/source`.

## Confirmed

- Portfolio API, static frontend and separate PostgreSQL are ready; one replica
  each, lower priority than Cresol. Its own bound PVC requests 2Gi.
- Requests total 145m CPU/208Mi memory; limits total 300m CPU/640Mi memory,
  matching the existing demos quota. No quota or priority change was made.
- Fresh server credentials were generated privately and were not reused from
  local previews or Cresol. Admin credentials are available to the PC owner in
  ignored, access-restricted `.local-deploy/vps-private/admin.json`.
- Static pages/assets, API liveness/readiness, May 2024 verified experience,
  authenticated create/update/delete and rejection of anonymous writes passed.
- A temporary experience record survived deletion/recreation of only the
  portfolio DB pod. It was removed afterward.
- A custom-format PostgreSQL dump restored into a separate temporary test
  database with the three verified roles; the test database was removed.
- One validated off-server copy was downloaded to ignored, access-restricted
  `.local-deploy/vps-backups/portfolio-20261019T143200Z.dump`. Its SHA-256 matches
  the server copy. Daily server backups retain 14 days. Recurring off-server
  replication is still a future step.
- Browser checks against the VPS through SSH passed for desktop/mobile widths,
  project filters, phone/app/screenshot switching and navigation, with no page
  errors. The private PC preview is `http://localhost:8100` while its SSH tunnel
  runs; the site continues running on the VPS when that tunnel closes.
- Host-specific Traefik routing is configured for `bennyuchiha.tech`. HTTP
  redirects to HTTPS except the HTTP-01 challenge path. The challenge path was
  tested from the PC over the public VPS address with the intended Host header.
- Portfolio-specific backup and certificate-renewal timers are enabled. The production certificate is issued and the staging renewal dry-run passed
  for both domain names.
- Cresol's four existing pods remain ready, with their existing names and
  restart counts. No Cresol workload, database, storage, credential, quota or
  routing resource was edited.

## Public HTTPS enabled

The registry now delegates to `ram.ns.cloudflare.com` and
`sasha.ns.cloudflare.com`. Google and Cloudflare public resolvers confirmed the
VPS origin before the user enabled the proxy; they now return Cloudflare edge
addresses. Both the apex and `www` are routed in the portfolio Ingress resources.
Some local/network DNS caches still return Hostinger's old `2.57.91.91` address,
even after clearing the Windows client cache. That is separate from the active
Cloudflare configuration.

The following command obtained a Let's Encrypt certificate covering both names:

```bash
bash /opt/benny-portfolio/ops/vps-issue-tls.sh
```

The certificate is installed in `demos/portfolio-tls`, expires on 17 January
2027, and is served by the VPS. HTTP-01 hooks preserve simultaneous tokens for
both names and annotate only the portfolio web Pod to refresh its projected
ConfigMap. Validation works through the Cloudflare proxy. HTTPS readiness passed
for both domains through Cloudflare and origin HTTPS verified successfully.
Cloudflare's Lagos edge returned HTTP 200 for the `www` homepage.

The user explicitly confirmed **Full (strict)** is selected in Cloudflare's
SSL/TLS Overview. Portfolio deployment and Cloudflare SSL setup are complete. The renewal timer is active, and the Certbot staging renewal simulation passed
for both names through Cloudflare.

Both apex and `www` are configured. Add other project domains with
their own reviewed hostname routes and certificate coverage. Future projects
also need reviewed resources: this portfolio uses the current demos CPU limit.
The existing VPS/Cresol cluster is reused; no second cluster was installed.

## Portrait and name update

The latest frontend release uses the exact user-confirmed name **Benedict Chuks-Onah**
and the supplied portrait in a responsive, subtly animated opening section.
The animation respects reduced-motion preferences. The public resume was updated.
Public HTTPS browser checks passed at desktop, tablet and phone widths, including
the retained 3D phone controls and project filters. API/database pods and Cresol
resources were preserved. Git working changes remain uncommitted/unpushed; the
VPS release and GitHub source history are separate.

## GitHub automation verified ? 20 October 2026

All accumulated project changes were committed and pushed to GitHub. The first
Actions build (run 39397669156) passed tests and published a completed release.
The VPS timer then pulled that commit and deployed the matching verified images
without an image upload from the PC. Public commit metadata and readiness passed.
The same PostgreSQL pod/PVC and all four Cresol pods remained healthy.
See [GITHUB_DEPLOYMENT.md](GITHUB_DEPLOYMENT.md) for everyday VS Code commit/push
steps and status commands. Future successful main pushes follow this pipeline.
