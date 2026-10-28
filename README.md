# Neotia Bhagirathi Woman and Child Care Centre – Raipur

Website and admin CMS for **Neotia Bhagirathi Woman and Child Care Centre, Raipur**.
Node.js (Express 5) + EJS templates, with a JSON file as the database: no external database server needed.

---

## Quick start (fresh clone)

Prerequisites: Node.js 18+ and npm.

```bash
npm install
cp .env.example .env        # Windows: copy .env.example .env
```

Open `.env` and fill it in (see [Configuration](#configuration)). At minimum set `SESSION_SECRET`, `PASSWORD_SALT` and `ADMIN_PASSWORD`.

```bash
npm start
```

The site runs at **http://localhost:3000** (or the `PORT` in `.env`).

On the first start, `data/database.json` doesn't exist yet, so it is created from **`data/database.seed.json`**. That gives you the Raipur specialities, pages, doctors, blogs and settings, with **no appointments, no enquiries and no accounts**. The first admin account is created from `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

Admin login: **http://localhost:3000/admin/login**, using the `ADMIN_USERNAME` / `ADMIN_PASSWORD` from your `.env`.

> `data/database.json` holds real patient leads and the admin account. It is git-ignored and must never be committed. Back it up separately.

---

## Configuration

All settings live in `.env` (template: `.env.example`).

| Variable | Required | Purpose |
|---|---|---|
| `SESSION_SECRET` | yes in production | Signs the admin session cookie. Use a long random string |
| `PASSWORD_SALT` | yes in production | Salt for admin password hashes. **Keep it fixed**: changing it invalidates existing admin passwords |
| `ADMIN_USERNAME` | no (default `admin`) | Username of the first admin account |
| `ADMIN_PASSWORD` | yes in production | Password of the first admin account. Only used when the database has no admins yet |
| `PORT` | no (default `3000`) | HTTP port |
| `NODE_ENV` | no | `production` makes the app refuse to start if a required variable is missing |
| `SITE_URL` | no | Public domain, e.g. `https://www.example.com`. Enables canonical / og:url tags. Blank = relative links |
| `RECAPTCHA_SITE_KEY` | no | reCAPTCHA v3 site key for the forms |

Generate a random secret:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Contact details (phones, address, map embed, email, social links, site domain) are edited in **/admin/settings** and stored in `siteInfo` in `data/database.json`.

---

## Admin CMS

| Section | What it does |
|---|---|
| Dashboard `/admin` | Counters for appointments, enquiries, doctors and specialities |
| Appointments `/admin/appointments` | View, filter by status, add notes |
| Enquiries `/admin/enquiries` | Callback requests from the site's forms |
| Doctors `/admin/doctors` | Add, edit or remove doctor profiles |
| Specialities `/admin/services` | Speciality records (name, slug, description) |
| Pages `/admin/pages` | CMS pages: SEO fields, publish / draft / trash, clone, rewrite |
| Blogs `/admin/blogs` | Health articles |
| Settings `/admin/settings` | Phones, WhatsApp, email, address, map, site URL, social links |

---

## Public routes

| Route | Page |
|---|---|
| `/` | Homepage |
| `/specialised-services` | All specialities (Woman Care / Child Care / Support) |
| `/:slug` | A speciality, e.g. `/obstetrics-gynaecology`. Uses `views/<slug>.ejs` if it exists, otherwise `views/service-detail.ejs` |
| `/find-a-doctor`, `/find-a-doctor/:slug` | Doctor finder, optionally filtered by speciality |
| `/doctor/:slug` | Doctor profile |
| `/book-an-appointment`, `/book-an-appointment/:slug` | Booking form, optionally with a speciality pre-selected |
| `/experience`, `/blog`, `/blog-details/:slug`, `/contact`, `/faq` | Content pages |
| `/privacy-and-policies`, `/disclaimer` | Legal pages |
| `/thank-you-for-appointment`, `/thank-you-for-enquiry` | Confirmation pages |

**Specialities** come from `departments[]` in the database: `name`, `order`, `group` (`woman` / `child` / `support`), and `status`.
- `status: "draft"` hides a speciality and makes it return 404. The paediatric sub-specialities are kept this way until the doctor roster is confirmed.
- Renamed speciality URLs redirect with a 301 (`RENAMED_SPECIALITIES` in `server.js`).

Form and search endpoints used by the front-end:
- `POST /form-sub/get_doctors.php`
- `POST /form-sub/book_appointment_submit_step.php`
- `POST /form-sub/book_appointment_submit.php`
- `POST /form-sub/enquiry_submit.php`
- `GET /form-sub/search_suggestions.php?keyword=…`

---

## Tests

Start the server in one terminal (`npm start`), then run the tests in another. They read the admin login from `.env`.

```bash
npm test                 # all suites below
npm run test:routes      # public pages, API endpoints, speciality pages, redirects and 404s
npm run test:admin       # admin login and CMS screens
npm run test:cms         # CMS pages: search, filter, clone, rewrite, trash
npm run test:i18n        # English / Hindi switching
npm run test:booking     # 2-step appointment booking
npm run test:leads       # enquiries and appointments reach the database
npm run check:assets     # every image on the homepage exists in public/
```

To test a server on another port: `PORT=3001 npm test` (PowerShell: `$env:PORT=3001; npm test`).

> `test:booking`, `test:leads`, `test:routes` and `test:cms` write test records to `data/database.json`. Copy it first if it must stay clean.

---

## Project structure

```
neotia-raipur/
├── server.js              Express app: routes, form endpoints, admin
├── database.js            JSON database layer; seeds data/database.json on first run
├── package.json
├── .env.example           Settings template (copy to .env)
├── data/
│   ├── database.seed.json Committed starting content (no leads, no accounts)
│   └── database.json      Live data, git-ignored, created on first run
├── views/                 EJS templates (partials/ = shared header, footer, action bar; admin/ = CMS)
├── public/                Served files: css/, js/, img/, upload/ (upload/pages/ = admin uploads, git-ignored)
├── brand-assets/          Client logo files and brand manual (source files, not served)
├── tests/                 Test scripts (npm test)
├── tools/checks/          verify_assets.js (npm run check:assets)
└── docs/                  Brand audit and Raipur localisation reports
```

Colours and the web font are defined once in `public/css/brand-tokens.css`; see `docs/brand-audit.md` and `CLAUDE.md`.
