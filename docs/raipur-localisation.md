# Raipur localisation: specialities + Kolkata / New Town removal

Done 2026-10-28. Verification screenshots are in [`raipur-localisation/`](raipur-localisation/).

**Kolkata / New Town matches on the live site** (views, JS, `server.js`, `database.js`, `data/database.json`): **713 → 431**.
On visible pages (views, excluding hidden ones): **149 → 36**.
Every remaining match has a reason:

| Remaining | Reason | Where |
|---:|---|---|
| 171 | Blog | 62 blog records + blog byline. List 4b |
| 81 | Doctor history / data | Doctor bios and education. List 4c |
| 71 | Hidden page (fix when restored) | 10 hidden speciality views + their data |
| 37 | Page revision history | `pages[].revisions` (old versions, not shown) |
| 33 | Claim | Superlatives, capability, "24x7", "Why Choose". List 4a |
| 12 | Press / news item | Homepage press and news section. List 4a |
| 10 | Doctor CMS page | 4 doctor pages (SEO titles / hero images) |
| 6 | Testimonial | Experience page. List 4a |
| 5 | Fact pending client data | Email + social links. List 2 |
| 4 | Stored submission record | Old appointment/enquiry records |
| 1 | Seed sample in code | `database.js` first-run sample appointment |

Outside the live site (not changed):
- 452 in seed files (`data/seed_data.json`, `pages_seed.json`; used only if `database.json` is missing)
- 82 in `sitemap.xml` (decision pending)
- 45 in `tools/` (they scrape the New Town site by design)
- 24 in docs / README / CLAUDE.md (project history)
- 2 in test fixtures (a blog slug)

---

## 1. Changed

### A. Specialities (Raipur sitemap list)

"Specialised Services" (label, page title, `/specialised-services`) is unchanged.

| # | Name | URL | Was | Data |
|---|---|---|---|---|
| 1 | Obstetrics & Gynaecology | `/obstetrics-gynaecology` | `/obstetrics-and-gynaecology` → **301** | dept 9, page 16 |
| 2 | Maternity & Birthing | `/maternity-birthing` | NEW | dept 19 |
| 3 | Foetal Medicine | `/foetal-medicine` | `/foetal-medicine-and-maternal-care` → **301** | dept 8, page 15 |
| 4 | Women's Health & Gynae-Onco Screening | `/womens-health` | NEW | dept 20 |
| 5 | Lactation Support | `/lactation-support` | NEW | dept 21 |
| 6 | Fertility & IVF | `/fertility-ivf` | `/fertility-and-reproductive-medicine` → **301** | dept 10, page 19 |
| 7 | Paediatrics | `/paediatrics` | `/paediatric-medicine` → **301** | dept 14, page 18 |
| 8 | Neonatology & NICU | `/neonatal-intensive-care` | renamed only | dept 6, page 14 |
| 9 | Paediatric Intensive Care (PICU) | `/paediatric-intensive-care` | NEW | dept 22 |
| 10 | Paediatric Surgery | `/paediatric-surgery` | unchanged | dept 4, page 17 |
| 11 | Vaccination & Immunisation | `/vaccination` | `/vaccination-and-preventive-care` → **301** | dept 7, page 28 |
| 12 | Diagnostics (USG / CT-MRI / Lab) | `/diagnostics` | `/ct-mri-scan` → **301** | dept 18, page 30 |
| 13 | Emergency | `/emergency` | NEW | dept 23 |

**Data (`data/database.json`):**
- Every department now has `group` (woman / child / support), `order`, `status`, `menuIcon` and `tagline`. The tagline is the existing card copy, unchanged.
- The matching CMS pages got new `title`, `heading`, `slug` and `url`.

**Hidden (draft, 404, data and files kept):**
- The specialities: Paediatric Cardiac Science, Gastroenterology, Neurology, Orthopaedics, Nephrology, Urology, Endocrinology, ENT, Dentistry, and Cardiac Cath Lab.
- Their department `status` and CMS page `status` are both `draft`.
- `/<slug>` and `/find-a-doctor/<slug>` return 404.
- They're gone from every list.
- To bring them back as "Paediatric sub-specialities", set `status: "published"` and pick a `group`/`order`.

**Redirects:** the 6 renamed slugs return **301** from `/<old>`, `/find-a-doctor/<old>` and `/book-an-appointment/<old>`, keeping any query string (`RENAMED_SPECIALITIES` in `server.js`).

**Views:**
- Six files renamed: `obstetrics-gynaecology`, `foetal-medicine`, `fertility-ivf`, `paediatrics`, `vaccination`, `diagnostics`.
- In these and in `neonatal-intensive-care.ejs` / `paediatric-surgery.ejs`, only these changed:
  - the `<title>`, now "<Name> in Raipur | Neotia Bhagirathi"
  - the meta description, location words only
  - the H1 → the speciality name (table below)
  - the booking form's own department label
  - self-links / `hlink`

| Page | H1 before | H1 after |
|---|---|---|
| obstetrics-gynaecology | Best Obstetrician & Gynaecologist in New Town, Kolkata | Obstetrics & Gynaecology |
| foetal-medicine | Foetal Medicine & Foetal Echocardiography in New Town, Kolkata | Foetal Medicine |
| fertility-ivf | Turning hope into a heartbeat. | *unchanged (tagline, not a name)* |
| paediatrics | Expert Paediatric Medicine in Kolkata \| Comprehensive Child Care | Paediatrics |
| neonatal-intensive-care | Neonatal Intensive Care Unit (NICU) in New Town, Kolkata | Neonatology & NICU |
| paediatric-surgery | Paediatric Surgery in New Town, Kolkata by Expert Paediatric Surgeons | Paediatric Surgery |
| vaccination | Child Vaccination & Preventive Care in New Town, Kolkata | Vaccination & Immunisation |
| diagnostics | Advanced CT & MRI Scan in Kolkata \| Precise Diagnostics | Diagnostics (USG / CT-MRI / Lab) |

**Every list now renders from the data, in sitemap order:**
- **Header:** the mega menu (3 columns: Woman Care / Child Care / Support) and the mobile drawer.
- **Shared tab partial** (`views/partials/speciality-tabs.ejs`), used by:
  - the homepage tabs
  - the `/specialised-services` grid, with the same card style
- **Tabs:** they're now *Woman Care / Child Care / Support*. "Paediatric Care" became "Child Care" to match the sitemap.
- **Footer** list.
- **Find a doctor:** filter tags, the callback select and `/find-a-doctor/<slug>`.
- **Booking:** the `/book-an-appointment` dropdown, the callback modal and the per-page booking forms. The Diagnostics form used to list all 18 old departments.
- **Search suggestions:** visible specialities only.
- The Hindi dictionary has the 11 new names, the "Child Care" and "Support" tab labels, and the placeholder line. I also fixed stray Bengali letters in the existing "Paediatric Surgery" Hindi.

**Icons reused for new items:**

| New speciality | Icon | Why |
|---|---|---|
| Maternity & Birthing | `/img/foetal.png` | Caring hands / mother & baby |
| Women's Health & Gynae-Onco Screening | `/img/gyno.png` | Uterus (women's health) |
| Lactation Support | `/img/foetal.png` | Caring hands / mother & baby |
| Paediatric Intensive Care (PICU) | `/img/nicu.png` | Monitor (intensive care) |
| Emergency | `/img/cardio.png` | ECG heart. `emergency.png` is white-on-transparent and invisible on white cards |

**Tests updated:**
- `test_routes`: Cardiac → Obstetrics, plus a new speciality block (13 × 200, 6 × 301, 10 × 404 with the find-a-doctor variants).
- `test_cms_pages`: page 13 → 16. Its rewrite step used to re-publish the hidden Cardiac page with New Town copy.
- `test_i18n`: page list updated.

### B. Kolkata / New Town

**`siteInfo`:**
- `hospitalName` → "Neotia Bhagirathi Woman and Child Care Centre - Raipur"
- `tagline` → "Paediatric & Child Hospital in Raipur | Neotia Bhagirathi"
- `address` → "Address to be confirmed"
- **New single-edit fields:**
  - `hospitalCentre`, stored with appointments; it was hard-coded "NBWCCC, New Town" in 11 forms and `server.js`
  - `siteUrl`
  - `mapEmbedUrl`
  - `appointmentNumberDisplay`
  - `city`
- All of them are editable in **/admin/settings**.

**Wording → Raipur (104 data fields + 79 view edits):**
- SEO titles and metas of 28 site pages
- Department names and metas
- Homepage intro paragraph
- FAQ "Where is the hospital located?" → "Address to be confirmed."
- Layout default `<title>` and meta
- Page titles: blog, contact, disclaimer, experience, FAQ, privacy, specialised, thank-you pages, doctor template
- Booking hero line
- Centre-naming sentences in Foetal Medicine and Obstetrics
- The form placeholder "e.g. New Town, Kolkata" → "e.g. Raipur"
- Admin editor placeholders and the rewrite-tool presets

**Facts moved to `siteInfo` (same values, now one edit):**
- Hard-coded phone numbers in the homepage call boxes, the booking hero, the disclaimer, and the Foetal / NICU / Vaccination error messages.
- The New Town Google Map iframe was removed; the map shows only once `mapEmbedUrl` is set.

**Links:**
- All 36 `canonicalUrl`s are now relative paths (the 37th page has none).
- New-page canonical defaults in `database.js` are relative too.
- `<link rel="canonical">` / `og:url` render only when `SITE_URL` (env) or `siteInfo.siteUrl` is set. It defaults to empty.
- The hero CTA fallback and the Obstetrics `hlink` no longer point to newtown.neotiahospital.com.
- 18 banner images that were hot-linked from newtown.neotiahospital.com now use the local copies in `public/upload/`.

---

## 2. Needs client data

Each item is one edit in **/admin/settings** (or `siteInfo` in `data/database.json`). Nothing was invented.

| Item | Current value (New Town) | Where it shows |
|---|---|---|
| Street address | "Address to be confirmed" (was Premises No. 27-0327, …, Newtown, Kolkata – 700156) | Footer, contact, FAQ |
| Map | none (New Town embed removed) | Contact page, set `mapEmbedUrl` |
| Site domain | empty → relative links, no canonical tag | `siteUrl` / `SITE_URL` env |
| Emergency numbers | 033 6640 5000 / 919147331175 (Kolkata landline) | Header, footer, homepage, booking, disclaimer, speciality forms |
| Appointment line | +91-33-6640-5018 (shown on homepage as "033 5012/5018") | Homepage call box, contact |
| OPD enquiries / diagnostics | +91-62921-49133 / +91-62921-49132 | Homepage call boxes, contact |
| WhatsApp | 919147331175 | WhatsApp float button |
| Email | connect.bnwccc@neotiahealthcare.com | Footer, contact |
| CIN | U85100WB2007PLC113081 (WB-registered company) | Footer / legal (confirm if the Raipur entity differs) |
| Social links | instagram/facebook `neotiabhagirathinewtown`, youtube `@NBWCC_NewTown`, x `BNWCCC`, LinkedIn | Footer |
| Centre name on forms | "Neotia Bhagirathi Woman and Child Care Centre, Raipur" | Stored with each appointment (confirm wording) |
| Sitemap / robots | still the New Town domain (82 matches) | Not served; regenerate once the domain is final |

## 3. Copy pending

These five pages use `service-detail.ejs` in copy-pending mode (`copyPending: true`). They show only:
- the name
- "Details for this speciality will be added soon."
- **Book An Appointment** and **Request a Callback**

They show no doctors, so none are guessed. Their homepage and grid cards have no tagline. No medical copy was written.

- `/maternity-birthing`: Maternity & Birthing
- `/womens-health`: Women's Health & Gynae-Onco Screening
- `/lactation-support`: Lactation Support
- `/paediatric-intensive-care`: Paediatric Intensive Care (PICU)
- `/emergency`: Emergency

When copy arrives, put it in the department's `overview` and `tagline` and remove `copyPending`, or give the page its own view.

## 4. Content to review

### 4a. Claims, press, testimonials (unchanged, per instructions)

| Where | Text | Suggestion |
|---|---|---|
| Homepage H1 (CMS page 1 `heading`, + Hindi in `i18n.js`) | "Leading Paediatric & Woman Super-Speciality Hospital in Kolkata" | **Rewrite** without the claim: "Paediatric & Woman Super-Speciality Hospital in Raipur" |
| Homepage meta (page 1) | "Premier super-speciality hospital in New Town, Kolkata…" | Rewrite: "Super-speciality hospital in Raipur dedicated to women and children." |
| Homepage "Why Choose Neotia Hospitals – New Town" (`index.ejs:117`) | Cards: "Award-winning Clinical Care in the East", "State-of-the-art Facilities", "Recognised for Safety and Sustainability", "Proven Excellence" | **Hide or rewrite** for Raipur; keep only what the client can stand behind |
| Homepage "Media Coverage of NBWCCC – New Town" + "What's New At NBWCCC – New Town" (`index.ejs:286–366`) | Cochlear-implant clinic launch in New Town; "Comprehensive child care under one roof in New Town"; links to thebengal.in / theinsightwire.in / newtown site | **Unpublish** (New Town press) until there's Raipur coverage |
| Layout keywords meta (`header.ejs:8`) | "Best PICU Hospital in Kolkata, … Best Child Specialist Hospital in New Town" | Rewrite without "Best": "Woman and child hospital in Raipur, Paediatric hospital in Raipur, PICU in Raipur" |
| Booking page title + meta (`book-an-appointment.ejs:2–3`) | "Best Gynecologist & Pediatrician New Town"; "leading doctors … Trusted … hospital in Rajarhat, Kolkata" | Rewrite: "Book Appointment \| Gynaecologist & Paediatrician in Raipur" |
| Obstetrics page body (`obstetrics-gynaecology.ejs:140–167`) | "best obstetricians … in Kolkata", "finest gynaecologists in Kolkata", "Gynaecological Surgery in Kolkata equipped with advanced laparoscopic…" | Rewrite with the Raipur team's actual services |
| Diagnostics page body (`diagnostics.ejs:193, 204`) | "advanced CT & MRI … New Town … scaled new peaks"; "CT & MRI services now available in New Town" | Rewrite once Raipur imaging (USG / CT-MRI / Lab) is confirmed |
| Disclaimer (`disclaimer.ejs:21`) | "24x7 Emergency line … emergency trauma room in New Town, Kolkata" | Keep the numbers (siteInfo); confirm Raipur 24x7 emergency, then say "in Raipur" |
| Experience page (`experience.ejs:37`) | "Our New Town campus is thoughtfully designed…" | Rewrite for the Raipur building |
| Experience testimonials (`experience.ejs:92–122`) | 3 New Town / Salt Lake / Rajarhat patients, "Neotia Bhagirathi New Town has been our trusted family hospital" | **Unpublish** until there are Raipur reviews |
| Contact page (CMS page 6) | Title "New Town Kolkata 24/7 Emergency"; "Located strategically in New Town… around the clock" | Rewrite after confirming Raipur emergency hours |
| NICU (CMS page 14) | "Level III NICU in Kolkata", "State-of-the-art Level III NICU facility in New Town" | Rewrite after confirming the Raipur NICU level |
| Fertility (page 19), Diagnostics (page 30), Experience (page 2) metas | "Leading fertility clinic … in Kolkata"; "3T MRI and 128-slice CT … in Kolkata"; "Level III NICU … in New Town" | Rewrite with confirmed Raipur facilities |
| `siteInfo.slogan` | "Eastern India's Trusted Name in Child Care" | Rewrite (regional claim) |
| Blog byline (`blog-detail.ejs:20`) | "Medical Team, Neotia Bhagirathi New Town" | Change together with the blog decision (4b) |

### 4b. Blogs (62, unchanged)

39 of the 62 blogs mention Kolkata / New Town / West Bengal, and most are local-SEO posts about New Town doctors and facilities ("The Best Paediatric Hospitals in Kolkata in 2026", "Top 5 Child Hospitals in Kolkata", "Meet the Best Child Specialist Doctors in Newtown, Kolkata", "Why NICU facilities are critical … in Kolkata", …).

- **Suggest unpublishing** the 39 location posts. Each one is New Town marketing and would mislead on a Raipur site.
- **Keep, after a light check,** the 23 general health guides (e.g. "Mental Health in Children", "Diabetes During Pregnancy", "First Dental Visit Guide", "Purple Day"). Several of these are about hidden sub-specialities (cardiac, ENT, gastro, neurology), so check the links in them.
- `blog-detail` links into hidden specialities now hit 404s; links into renamed ones redirect.

### 4c. Doctors (no doctor record was edited)

**Doctors whose speciality no longer maps to a visible speciality (18):**

| Doctor | Speciality | Note |
|---|---|---|
| Dr. Debapriya Roy, Dr. Indrasish Ray Chaudhuri, Dr. Arijit Chattopadhay | Paediatric Neurology | Hidden sub-speciality |
| Dr. Sanjiban Ghosh, Dr. Aritra Mukherji | Paediatric and Foetal Cardiology | Cardiology hidden; foetal cardiology could sit under **Foetal Medicine**. Client to decide |
| Dr. Nilanjan Dutta | Paediatric and Congenital Cardiac Surgery | Hidden (cardiac) |
| Dr. Sayandeep Jana | Cardiac Anaesthesia and Critical Care | Hidden (cardiac); possibly PICU |
| Dr. Abhishek Nandi, Dr. Soumya Paik | Paediatric Orthopaedics | Hidden |
| Dr. Sayan Banerjee, Dr. Hriday De, Dr. Supratik Bhattacharyya | Paediatric Endocrinology / Endocrinology | Hidden |
| Dr. Subhamoy Das, Dr. Ryan Sohail Kaiser | Paediatric Gastroenterology (& Hepatology) | Hidden |
| Dr. Sumantra Kumar Raut | Paediatric Nephrology | Hidden |
| Dr. Poonam Guha Vaze | Paediatric Urology | Hidden |
| Dr. Rima Nandi | Paediatric Dentistry | Hidden |

The site's keyword matcher still files some of them under **Paediatrics**, because their speciality text contains "Paediatric". Their profile pages still work.

**Doctor history mentioning Kolkata / New Town (listed only):**
- Dr. Bikramjit Das, Dr. Sanjiban Ghosh, Dr. Aritra Mukherji, Dr. Sayandeep Jana, Dr. Debapriya Roy, Dr. Prosun Bera, Dr. Chandrani Pal, Dr. Indrasish Ray Chaudhuri, Dr. Sumona Haque, Dr. Niladri Bose: education or previous posts (e.g. "MBBS – Medical College, Kolkata", "NRS Medical College, Kolkata").
- Dr. Subhamoy Das, Dr. Somenath Gorain, Dr. Sumantra Kumar Raut, Dr. Poonam Guha Vaze: their *current* post is described as "at Neotia Bhagirathi … New Town". This will be wrong on the Raipur site, so it needs the client's doctor form.
- 4 doctor CMS pages (Dr. Nitin Vyas, Dr. Bikramjit Das, Dr. Sayan Banerjee, Dr. Sanjiban Ghosh) have "Neotia Hospital Kolkata" in their SEO titles, and 3 hot-link banner images from newtown.neotiahospital.com.
- 16 doctors' `bannerImage` URLs still point to newtown.neotiahospital.com. Local copies exist, but doctor records weren't edited.

### 4d. Images with Kolkata / New Town text

| File | Text | Page |
|---|---|---|
| `public/upload/fileManager/media/news2_listi.jpg` | Press clipping: "**Calcutta**: The Neotia Bhagirathi Woman and Child Care Centre in **New Town**…" | Homepage press section |
| `public/upload/fileManager/media/news1_listi.jpg` | Bengali press clipping naming New Town (নিউ টাউনে) | Homepage press section |
| `public/upload/fileManager/blog/blog1-feb26-Trusted-Child-Hospital-in-Kolkata.webp`, `blog3-apr26-d-child-hospitals-in-kolkata.webp`, `blog4-feb26-child-vaccination-centre-kolkata.webp`, `Gastroenterologist_in_Kolkata.webp`, `nicu_kolkata.webp`, `Vaccination_Hospital_for_Kids_Kolkata.webp` | "Kolkata" in the **file name** only; the pictures carry no text | Blog posts |

The other ~150 images on live pages were checked visually (banners, speciality art, site photos): none show Kolkata / New Town text.

---

### Notes

- Hidden speciality views (`paediatric-*.ejs`, `cardiac-cath-lab.ejs`) were **not** edited: 71 matches, claims included. Clean them up when they come back.
- The mobile drawer's "Specialised Services" item links to `/specialised-services` (which lists all 13). Its sub-menu toggle has been hidden since before this change.
- Tests: `npm test` passes (6 suites + `check:assets`). The database was backed up before the run and restored afterwards; it matches the backup exactly.
