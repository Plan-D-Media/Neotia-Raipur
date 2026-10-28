# Brand audit: Neotia Bhagirathi Raipur website

Audited 2026-10-28 against *NBWCCC BRAND MANUAL (1).pdf*, then fixed with the client's decisions (a)–(g) and re-audited the same day.

- **Before:** 18 pages (incl. modals, language dropdown, 404, admin login) × 1440 / 768 / 390 px × header unscrolled / scrolled = 99 screenshots in [`brand-audit/`](brand-audit/) (`<page>_<width>_<state>.jpg`).
- **After:** the same 99 states were re-measured. The key screens are in [`brand-audit/after/`](brand-audit/after/): home, Specialised Services (inner page), doctor, booking and contact, each top/scrolled at 1440/768/390. Plus `mobile-search-open_390`, `mobile-bottom-bar_390`, `action-bar-search_1440` and `hindi-action-bar_1440`.

**Before: 27 checks. 5 match, 16 don't, 6 need a client decision.**
**After: 27 checks. 26 match, 0 don't, 1 open (the logo files' colours, waiting for the client's corrected exports).**

Clear-space unit **x** = one arm of the plus = 647 / 6000 of the logo width. That's 21 px in the desktop header (80 px tall), 15 px on mobile (57 px) and 19.4 px in the footer (74 px).

| # | Area | Manual says (page) | Before (file:line, screenshot) | | After | |
|---|---|---|---|---|---|---|
| 1 | Logo: file & shape | Use the 4-colour logo as supplied, no stretch/rebuild (2.4, 2.8) | Supplied SVG, aspect 2.438 vs viewBox 2.440, no filter. `header.ejs:179`, `footer.ejs:7` | ✅ | Unchanged: one `<img class="site-logo">` in the header, same SVG in footer and admin | ✅ |
| 2 | Logo: colours in the supplied file | Logo artwork uses #F6921E / #0061AE / #0E4E95 (p.19, p.25) | Client's SVG (logo and plus/favicon) uses #F39314 / #185CA6 / #27488D, up to 25 units off | ⚠ | **Open.** Files left as supplied; the client is sending corrected exports. Drop them into `public/img/` under the same names | ⚠ |
| 3 | Logo: reversed/white version | No white or reversed version exists (2.4–2.5, 2.9) | `neotia-raipur-logo-white.svg` on the homepage hero, modals over the hero and admin login | ❌ | Moved to `_archive/public-img/`. No reference left anywhere (`grep logo-white` = 0) | ✅ |
| 4 | Logo: background | "Only White" (p.24) | White only on 404, booking and the scrolled header. Pale tints on 5 pages. Dark Blue-2 banner on 5 pages (logo barely visible). Footer #F5FAFF. Admin #0D4E96 | ❌ | Solid white header bar on every page, width and scroll state (`brand.css` §3). Footer → white (`style.css` footer). Admin logo on its own white panel (`admin/login.ejs`). Pixel test of the clear zone: 0 non-white pixels at rest | ✅ |
| 5 | Logo: minimum size | ≥ 1.5 cm ≈ 57 px tall (p.21) | Header 49 px at 768 and 390 | ❌ | Header 80 px (≥ 992), 60 px (769–991), 57 px (≤ 768). Footer 74 px. Admin 64 px | ✅ |
| 6 | Logo: clear space | x on all four sides (p.22) | "\| Raipur" select 10 px away. Top edge 16–18 px (< 21). Footer `<p>` 15 px (< 19.4). Mobile breadcrumb overlapped | ❌ | "\| Raipur" select removed. Header padding x + 2 px on every side, inset where the gutter is narrower than x. Footer logo margin 22 px and 20 px left inset | ✅ |
| 7 | Lockup | Don't separate or re-proportion (p.23) | Always the full lockup | ✅ | Unchanged | ✅ |
| 8 | Favicon / touch icon | Plus mnemonic, keep proportions (2.10) | Correct (colour caveat as #2) | ✅ | Unchanged | ✅ |
| 9 | AmbujaNeotia parent logo | Not governed | Forced white by CSS filter on the hero; unreadable on dark banners | ⚠ | Full colour, unfiltered, 23 px tall, always on the white header | ✅ |
| 10 | Colour tokens | Brand palette (3.1–3.4) | Three ad-hoc vars; 1,754 hard-coded colours | ❌ | One `:root` block: all 12 brand colours/tints, `--white`, `--grey-bg`, neutral greys, `--ui-error`, `--ui-success`, RGB channels, `--font-brand`. 1,340 literals replaced with `var(--…)`. Bootstrap's own colours bridged to the tokens. Left as literals: 392 white `stroke/fill/color` attributes on inline SVG icons (`var()` isn't valid there) | ✅ |
| 11 | Blues | Blue 1 / Blue 2 exactly | #1061AF ×131, #0D4E96 ×103, 20 other near-blues | ⚠ | All mapped to `--brand-blue-1/2` or the nearest tint | ✅ |
| 12 | Oranges | #F7931D | #F58220 ×86, #F7941E ×17, hover oranges | ❌ | All → `--brand-orange`. Primary hover → `--brand-orange-tint-1` (#FAA519) | ✅ |
| 13 | Off-brand hues | Palette only | 31 hexes: Bootstrap #0D6EFD, purples, yellows, pink, decorative green | ❌ | Mapped to the nearest token in the same hue family. Yellow highlights → #FDB813. Decorative icons → Blue 1 / orange | ✅ |
| 14 | Tinted greys & pale tints | White + neutral greys | ~305 slate greys and pale blue backgrounds | ⚠ | Decision (e): section backgrounds white or `--grey-bg` #F5F5F5 only. Slate greys → neutral ramp. Text greys darkened to ≥ #666 | ✅ |
| 15 | Functional colours | Not covered | Mixed reds/greens | ⚠ | Decision (f): `--ui-error` #C62828 and `--ui-success` #2E7D32, used for validation messages, required `*`, success alerts, the booking-step "done" state and admin status badges. Decorative reds/greens moved to brand colours | ✅ |
| 16 | Gradients & overlays | Not covered | Blue 2 → #154C86; navy hero overlay | ⚠ | Rendered gradients now Blue 2 → Blue-2 tint 1 and Blue-2 tint 3 → Blue 2. Hero overlay uses Blue-2 tint 3 channels | ✅ |
| 17 | Web typeface | Zen Maru Gothic only (p.39–40) | Montserrat via `@import` | ❌ | Montserrat removed. Zen Maru Gothic 400/700 from Google Fonts (preconnect + `display=swap`). Network log: 0 Montserrat requests | ✅ |
| 18 | Weights | 400 + 700 only (p.40) | 500/600/800 in use | ❌ | 500 → 400, 600/800 → 700. Headings, nav, buttons and tabs 700; body, inputs and labels 400. Rendered: 1,014 elements at 700, 897 at 400, nothing else | ✅ |
| 19 | Stray fonts | — | System fonts on the language pill/admin. Hind + Devanagari on every page | ❌ | One stack everywhere: `'Zen Maru Gothic', 'Noto Sans Devanagari', sans-serif`. Noto Sans Devanagari 400/700 is requested **only when Hindi is selected**: server-rendered for `lang=hi`, added by `i18n.js` on a client-side switch. English pages request Zen Maru only | ✅ |
| 20 | Yuzu / Marck Script | Not for the website | Not used | ✅ | Not used | ✅ |
| 21 | Hierarchy | Headlines Bold, body Regular | ✅ | ✅ | `.section-heading` was 400, now 700 | ✅ |
| 22 | Contrast: white on orange | AA 4.5:1 | 57 instances at 2.28–2.59:1 | ❌ | Primary CTA = orange + #093153 text (5.8:1). **0 white-on-orange** at rest and on hover, across 14 pages × 4 widths (incl. the homepage call boxes and the admin "Sign In") | ✅ |
| 23 | Contrast: orange text on white | AA | Tabs, "View Profile", headings, eyebrows at 2.3:1 | ❌ | 44 non-accent orange text rules → Blue 1 (6.32:1). Orange kept for icons, underlines and highlights on dark banners (#FDB813 on Blue 2: 4.74:1) | ✅ |
| 24 | Contrast: header on dark banners | AA | Nav 1.6:1, "Call Emergency" 1.01:1 | ❌ | White header: nav Blue 2 on white (8.26:1), hover Blue 1. Phone pills Blue 2 border/text | ✅ |
| 25 | Contrast: find-a-doctor hero | 3:1 | White on pale photo, 1.08:1 | ❌ | Blue 2 heading. Pixel-measured over-image text: 0 failures (the only hit is the `<video>` fallback text, which never renders) | ✅ |
| 26 | Contrast: pale greys | AA | #94A3B8, #999, `text-white-50` | ❌ | Text greys ≥ #666 (5.74:1). `.text-white-50` → 85% white (6.9:1 on Blue 2) | ✅ |
| 27 | Contrast: Bootstrap blue | AA | #0D6EFD at 4.1–4.3:1 | ❌ | Bootstrap primary/link/pagination/dropdown → Blue 1 (6.32:1) | ✅ |

## Decisions applied

- **(a)** Solid white header everywhere, 4-colour logo only, white logo archived. Nav Blue 2, hover Blue 1. AmbujaNeotia logo in colour.
- **(b) Hindi font: Noto Sans Devanagari 400/700, loaded only for Hindi. *Pending client confirmation.***
- **(c)** Primary CTA orange + #093153 (hover #FAA519). Secondary CTA Blue 1 + white (hover Blue 2). Orange otherwise accents only.
- **(d)** "\| Raipur" dropdown removed.
- **(e)** Section backgrounds white or #F5F5F5. Solid brand blocks only away from the logo.
- **(f)** `--ui-error` #C62828, `--ui-success` #2E7D32.
- **(g)** Logo ≥ 57 px tall with clear space x at every breakpoint.

## What could not be made to match the manual

- **Logo file colours (#2).** The supplied SVGs use #F39314 / #185CA6 / #27488D. They're left untouched as instructed until the client's corrected exports arrive.
- **The token block lives in `public/css/brand-tokens.css`, not inside `style.css`.** The admin pages don't load `style.css`, so a block inside it would leave every admin colour undefined. `brand-tokens.css` loads first on every public and admin page, and the top of `style.css` points to it. It's still one block.
- **White SVG attributes.** 392 `stroke="#ffffff"`-style attributes on inline icon SVGs stay literal, because CSS variables don't work in SVG presentation attributes. White is an allowed colour.
- **WhatsApp button.** WhatsApp green has no brand equivalent, so the float is Blue 1 with the white WhatsApp glyph.
- **Third-party and raster content.** The embedded Google Map, photos, and the white PNG icons in the homepage call boxes keep their own colours. The call-box icons are decorative: the text beside them carries the number and passes AA.
- **Transient overlap.** When the footer scrolls under the fixed action bar (desktop) or the bottom bar (mobile), the bars briefly pass over the footer logo's clear zone. It's inherent to fixed bars, and at rest the footer logo has full white clear space.
- **Admin status badges** use `--ui-error`/`--ui-success` for state (New/Confirmed/Trashed). The orange "Contacted/Draft" badges became Blue 1 text to pass contrast, so those two states are now told apart by label only.

## Hero actions (new)

- `views/partials/action-bar.ejs` is included once from the shared header partial; `public/js/action-bar.js` drives it; styles are in `public/css/brand.css`.
- **≥ 769 px:** a sticky bar under the header with search (shared autocomplete, `/form-sub/search_suggestions.php`), "Book An Appointment" and "Request a Callback". On the homepage it slides in only once the hero search and buttons leave the viewport (IntersectionObserver), with no animation under `prefers-reduced-motion`. On inner pages it shows from the top.
- **≤ 768 px:**
  - A fixed bottom bar with both buttons (48 px tall, safe-area padding). On the homepage it's hidden while the hero buttons are on screen.
  - A search icon in the header opens a full-width search panel, which closes on Escape or a tap outside.
  - WhatsApp and back-to-top sit above the bar, and the vertical callback tab is hidden.
- **Request a Callback** opens the page's own `#requestcallback` modal. Pages without one get it from a `<template>` in the footer, so IDs are never duplicated. Tested on pages with and without it, and one test enquiry was submitted successfully.
- **Layout:** page content, anchors and focused fields stay clear of the bars, via a measured `--page-offset` and `scroll-padding`. z-index: header 1030 and bars 1029, both below Bootstrap modals (1055).
- **Accessibility:**
  - visible 3 px focus rings
  - `aria-label` on the icon buttons; the hamburger now works with Enter and Space
  - arrow keys move through search suggestions
  - all labels translate in Hindi
- "Book An Appointment Online" → "Book An Appointment" (CMS `ctaText` in `data/database.json`; the obsolete i18n dictionary entry removed). The page title "Book an OPD Appointment Online" is page copy and was not changed.

## Noticed, out of scope (not fixed)

- **New Town / Kolkata content everywhere:**
  - "New Town/Newtown" 125× in 36 views and 209× in `data/database.json`; "Kolkata" 83× in views, 269× in data.
  - Hospital name "… – New Town" and the New Town address in settings.
  - Kolkata landline 033 6640 5000 and 91 91473 31175 in the header, footer and 10 views.
  - Default `<title>`/meta/keywords in `header.ejs:6-8`.
  - Home H1 "… Hospital in Kolkata".
  - 9 links to newtown.neotiahospital.com in views and 79 in data.
- **`sitemap.xml` / `robots.txt`:** not served, and point to the New Town domain.
- **Admin login** still pre-fills the username `admin`, and the server's start-up console message prints the default login. The page itself no longer shows the password.
- **Manual errata:** Blue 2 RGB is printed as 247,147,29 (the swatch is #0E4E95). The orange swatch is drawn as #F6921E while the printed value is #F7931D (we use the printed one).

## Fixed bugs found in the audit

- The 11 CMS pages that crashed at `service-detail.ejs:33` now render (the icon block is skipped when there's no department icon).
- Errors show a plain 500 page (`views/500.ejs`). Details go to the server log only, and no stack trace or file path reaches the browser.
- The default password is no longer shown on the admin login page, neither as the hint nor as a pre-filled value.
- Also fixed on the way:
  - Form and search requests used relative `form-sub/…` URLs, which broke on nested pages such as `/doctor/:slug`.
  - Two unscoped `.nav-link { color: white !important }` rules made tab buttons white-on-white on tablet and mobile.
  - The Hindi font rule overrode the icon font.
  - Below 992 px, the desktop language pill was squeezed against the screen edge.
