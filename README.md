# Benedict Chuks-Onah — software engineering portfolio

Live: https://www.bennyuchiha.tech

For the full history, SSH access and next-agent runbook, read
[portfolio handoff](docs/PORTFOLIO_HANDOFF.md) and [agent instructions](AGENTS.md).

Production updates use **commit → push main → GitHub Actions → VPS auto-deploy**.
See [GitHub deployment guide](docs/GITHUB_DEPLOYMENT.md) for VS Code steps,
deployment status, rollback behavior and service commands.

Benedict Chuks-Onah's web, mobile and backend portfolio. React/Vite and Three.js, with a small
Express/PostgreSQL API for managing experience entries.

Featured work: **Cresol ERP**, **KekeDrop passenger and driver apps**,
**Cresol Store**, **TrackMeNG**, **Waffles Runner**, and collaborative **BLOP** design work.
Project categories describe actual contributions, rather than claiming ownership of
every part of every product.

## Preview locally

```powershell
.\deploy\local.ps1 -Action Start
```

Open **http://localhost:8098**. For the separate local Kubernetes preview:

```powershell
.\deploy\local-kubernetes.ps1 -ToolsDirectory 'D:\Documents\CODE\PYTHON\Django\Cresol_ecommerce_Store\.tools'
```

Open **http://localhost:8099**. Both previews have their own PostgreSQL database.
Administration: `/?admin=1`. Credentials are generated in ignored
`.env.production.local`; no admin credentials are bundled into browser assets.

See [deployment instructions](docs/DEPLOYMENT.md),
[personalization sources](docs/PROFILE_SOURCES.md), and the
[shared assistant handoff](docs/assistant-handoff.json).

## Edit the portfolio

- Identity, skills and project descriptions: `src/data/profile.js`.
- Verified experience and default API records: `shared/experience.json`.
- Three.js phone and screenshot controls: `src/components/MobileShowcase.jsx`.
- Real Google Play screenshots: `public/projects/kekedrop/`.
- Interface styles: `src/portfolio.css`.
- Contact: direct email works without a service; optional EmailJS browser settings
  are documented in `.env.production.example`.

The phone shows real screenshots from the user-supplied Google Play listings:
[KekeDrop](https://play.google.com/store/apps/details?id=com.kekedrop.user) and
[KekeDrop Driver](https://play.google.com/store/apps/details?id=com.kekedrop.rider).
Original ERP templates are rendered with **synthetic demonstration data** for
the screenshot; no private company records are published. The resume archive
and extracted source documents remain under ignored `.local-deploy/`.
Only the curated public resume PDF is served.

## Development and validation

```powershell
npm ci
npm run dev
npm run build
npm test
node deploy/smoke-test.mjs --restart-database
```

Use `.env.example` for a non-container development setup. The original
`docker-compose.yml` and root Dockerfile are legacy development helpers;
the production-image preview uses `compose.production.yaml` and `deploy/Dockerfile.*`.

An idempotent startup migration replaces only exact, untouched tutorial
experience seeds. It preserves edited/custom records. Empty databases are seeded
from the shared experience file. Back up important data before deploying changes.

## Credits

Portfolio foundation adapted from
[JavaScript Mastery's 3D portfolio tutorial](https://github.com/adrianhajdin/project_3D_developer_portfolio).
The website's identity, project content, API integration and phone showcase are
personalized for Benedict Chuks-Onah.

Phone model: [Phone by Quaternius](https://poly.pizza/m/k2kgBepoMU), **CC0 1.0**.
The retained workstation is based on
[Gaming Desktop PC](https://sketchfab.com/3d-models/gaming-desktop-pc-d1d8282c9916438091f11aeb28787b66)
by [Yolala1232](https://sketchfab.com/Yolala1232), licensed under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
See [public asset credits](public/credits.html) and model license files.
