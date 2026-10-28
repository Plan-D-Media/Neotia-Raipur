# Neotia Bhagirathi Raipur website

Express + EJS site with a JSON database and an admin CMS. `npm start` serves it on http://localhost:3000 (admin: `/admin`, login from `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `.env`).
Settings and secrets live in `.env` (template `.env.example`); never hard-code them.
This folder is not a git repo. Back up before bulk changes.

## Which folder for which job

| Job | Where |
|---|---|
| Change doctor info | `/admin/doctors` in the CMS, or `data/database.json` (`doctors`) |
| Change department / service data | `/admin/services`, or `data/database.json` (`departments`) |
| Change the speciality list (names, order, groups, show/hide) | `data/database.json` `departments[]`: `name`, `order`, `group` (woman / child / support), `status` (`draft` hides it and returns 404), `menuIcon`, `tagline`. Nav, footer, homepage tabs, /specialised-services, booking and find-a-doctor all render from it. Renamed slugs 301 via `RENAMED_SPECIALITIES` in `server.js` |
| Change service page copy | `views/<slug>.ejs` (e.g. `views/obstetrics-gynaecology.ejs`); specialities without their own view use `views/service-detail.ejs` (`copyPending: true` shows only the name, a placeholder line and the CTAs) |
| Change header, nav, favicon links | `views/partials/header.ejs` (white header styles: `public/css/brand.css` §3) |
| Change the sticky search / Book / Callback bar | `views/partials/action-bar.ejs`, `public/js/action-bar.js`, `public/css/brand.css` §4 |
| Change footer | `views/partials/footer.ejs` |
| Change phone numbers, address, map, site domain, socials | `/admin/settings` (stored in `data/database.json` `siteInfo`; views read them from there). Raipur values still pending: see `docs/raipur-localisation.md` |
| Change colours or the font | `public/css/brand-tokens.css` only: one `:root` block of brand tokens. Everywhere else use `var(--token)`, never a hex value (Brand Manual: logo on white only, Zen Maru Gothic 400/700) |
| Change styles | `public/css/style.css` (mobile: `public/css/responsive.css`, languages: `public/css/i18n.css`, brand layer loaded last: `public/css/brand.css`). |
| Change front-end behaviour | `public/js/` |
| Add or replace images | `public/img/` (uploads land in `public/upload/`) |
| Logos and favicon | Served: `public/img/neotia-raipur-logo.svg` (4-colour, the only logo; there is no white version), `favicon.svg`. Client originals and the brand manual: `brand-assets/`. Brand audit: `docs/brand-audit.md` |
| Add or change a route / form endpoint | `server.js` |
| Change how data is read or saved | `database.js` |
| Run tests | `npm test` or `npm run test:<name>` with the server running (see `package.json`) |
| Check images referenced on pages exist | `npm run check:assets` (server running) |

## Data and files that must not be committed

- `data/database.json` Live data (real appointments, enquiries, admin account). Git-ignored. A fresh clone creates it from `data/database.seed.json` on first start.
- `.env` Secrets. Git-ignored.
- `public/upload/pages/` Images uploaded through the admin page editor. Git-ignored.
- Update `data/database.seed.json` when site content should ship with the repo, and keep `appointments`, `enquiries` and `admins` empty in it.

## Folders that are not the live site

- `tools/checks/verify_assets.js` Asset check (`npm run check:assets`).
- `brand-assets/` Client logo files and brand manual. Source only, not served.
- `docs/` Brand audit and Raipur localisation reports. Their screenshot folders were moved out before the first push.

## Conventions

- Preview mode (`PREVIEW_MODE=true`, always on Vercel) is read-only: `database.js` loads the seed into memory and never saves, forms are logged not stored, admin POSTs are refused in `server.js`. Any new write path must respect `db.isPreview()`.

- Scripts in `tools/` and `tests/` build paths with `path.join(__dirname, '..', ...)` so they run from any directory. Keep it that way.
- Tests hit `localhost:3000` (set `PORT=3001` to test another instance), and `test:booking`, `test:leads` and `test:cms` write records to `data/database.json`. Copy it first if it must stay clean.
