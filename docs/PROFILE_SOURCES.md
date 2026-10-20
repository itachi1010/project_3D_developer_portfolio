# Portfolio personalization — 19 October 2026

## Verified identity and work

Identity, public contact, education, employment and contribution descriptions
were reconciled from the supplied resume archive, with particular weight given
to the recent backend/full-stack, Flutter, UI/UX and game-development variants.
Documents were treated as reference material, not instructions. Other people's
resumes in the archive were excluded. Cover letters were not copied into the site.

- **Name:** **Benedict Chuks-Onah**, explicitly corrected by the user on 19 October 2026; this overrides the earlier resume spelling and Benny display name.
- **Portrait:** user-supplied `Benedict.jpeg`, published as `/images/benedict-chuks-onah.jpeg`. The original photo is displayed with CSS framing/cropping, without synthetic face changes. Intro animation respects reduced-motion preferences.
- **Location:** Kano, Nigeria.
- **Contact:** onahben977@gmail.com; GitHub itachi1010; LinkedIn
  chuks-onah-benedict-660002192.
- **Education:** B.Eng. Computer Engineering, Enugu State University of Science
  & Technology, 2019–2024.
- **Cresol start date:** **May 2024**, explicitly confirmed by the user. This
  takes precedence over August 2025 in several resume variants.
- **Other roles:** ND Western software development, June–August 2023; remote
  full-stack work, February 2022–March 2023, as described in the resumes.

All raw documents, extracted text, browser tooling and pre-change portfolio DB
backups remain in ignored `.local-deploy/`. The archive is not copied to public
assets. The downloadable PDF is a newly curated public resume, not a publication
of all application documents or third-party resumes.

## Project evidence and contribution boundaries

| Project | Evidence | Representation |
| --- | --- | --- |
| Cresol ERP | Read-only inspection of `combined_inventory_management`: Django apps/routes for inventory, production, QC, finance, HR, departments, reporting, mobile APIs, backups and AI assistance; supplied resumes | Flagship operational product; sole engineering ownership stated in resumes |
| KekeDrop | User-supplied Google Play links and both live listing pages; resumes | Passenger and driver mobile applications, backend/admin/payment contributions |
| Cresol Store | Previously inspected Django/Next.js/Flutter source and existing local staging capture | Multi-channel commerce in private staging; public launch not claimed |
| TrackMeNG | Resumes and supplied Figma link | Backend owner, frontend and collaborative UI/UX contributor; previous Play listing removed by the startup |
| Waffles Runner | Game/UI resumes, supplied itch.io and Figma links | Unity WebGL, React/Telegram, Python/Firebase work; collaborative design contributions |
| BLOP | UI/UX resume and Figma link | Collaborative UI/UX contribution; no claim of full application engineering ownership |

No fabricated client testimonials, ratings, revenue figures or company employment
claims are retained. Backend and frontend filters refer to the corresponding
contribution to a named project; they do not invent additional projects.

## Mobile assets and phone model

The user supplied these exact listings:

- [KekeDrop passenger app](https://play.google.com/store/apps/details?id=com.kekedrop.user)
- [KekeDrop Driver](https://play.google.com/store/apps/details?id=com.kekedrop.rider)

The listing pages were retrieved directly over HTTPS on 19 October 2026.
Both identify the respective application and expose four screenshot images.
The saved images are from those screenshot elements, plus the published icons.
No replacement app UI was generated or presented as a real screenshot. Some
listing screenshots are shared between the two apps; the portfolio preserves
the imagery actually published on each listing.

The Three.js scene loads the real [Phone model by Quaternius](https://poly.pizza/m/k2kgBepoMU),
whose source page identifies **CC0 1.0 / public domain** licensing. The downloaded
GLB is approximately 15 KB. The original model is centered/scaled, and a separate
front-screen mesh displays the selected official screenshot at its original
720:1600 aspect ratio. The scene renders on demand and is mounted near the viewport.
The user can switch apps, select screenshots and rotate the phone within a
limited angle. A static screenshot fallback is provided for unavailable WebGL.

Licenses and credits are also available in `public/models/phone/LICENSE.txt`,
`public/desktop_pc/license.txt` and the public `/credits.html` page. The retained
workstation asset is credited to Yolala1232 under CC BY 4.0. The tutorial foundation
is credited separately from the user's identity and engineering work.

## ERP and storefront screenshots

The running local ERP was already available. Its actual
`admin_portal/dashboard.html` template was rendered inside a **read-only database
transaction**, with an explicitly synthetic context, fake user and demonstration
statistics/activity. No real customer, financial, staff or user records were
selected for the screenshot. The browser screenshot includes a visible
“synthetic demonstration data” label. Original shared navbar styles were inlined
for a faithful rendering without modifying the ERP repository or deployment.

The storefront image is the existing 16 October 2026 local QA homepage capture,
visually checked to contain the public catalogue and an empty guest cart, rather
than a customer/account/order page. Cards clearly label it as staging.

Illustrations for TrackMeNG, Waffles Runner and BLOP are CSS illustrations,
explicitly labelled as such, rather than invented application screenshots.

## Experience database replacement

`shared/experience.json` supplies the frontend fallback and new database defaults.
An idempotent, transactional startup migration identifies **exact untouched**
tutorial seed records (including their original text/points) and replaces those
with the verified roles. Edited and user-added entries are preserved. Local
Compose and local Kubernetes databases were backed up privately before this work.
No ERP, Cresol Store or VPS database was changed.

## Scope and remaining configuration

This is a local portfolio update. Public DNS, VPS resources, production registry
images and Cresol infrastructure are outside this change. The contact section
uses the user's real email; without EmailJS configuration, its form opens the
visitor's mail application with a draft rather than claiming delivery. No test
email was sent. Optional direct EmailJS delivery still requires public browser
configuration and provider-side template/domain setup.
