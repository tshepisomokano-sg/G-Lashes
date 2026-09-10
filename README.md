# G-Lashes website (plain HTML/CSS/JS)

This is a plain HTML/CSS/JS version of the G-Lashes site — no build step,
no React, no npm install. It talks to the same Supabase project the
original Lovable build used, so booking data lands in the same
`services` and `bookings` tables.

## Folder structure

```
index.html          the page shell — loads CSS/JS and holds one <div> per section
css/
  variables.css      colours, fonts (the design tokens — change the look here)
  base.css           resets, typography, focus styles
  layout.css          header / hero / services / studio / contact / footer layout
  components.css      buttons, calendar widget, booking form, toast
js/
  config.js           Supabase URL/key, contact details, opening hours
  supabase-client.js  sets up window.db (the Supabase client)
  calendar.js          the month-calendar widget (no external deps)
  booking.js           booking logic: load services, load taken slots, submit a booking
  main.js              loads each section below into index.html, then boots booking.js
sections/
  header.html, hero.html, services.html, studio.html,
  booking.html, contact.html, footer.html
assets/
  images/              hero-lashes.jpg, brows.jpg
  favicon.ico
```

Each section is its own file so you can find and fix things fast: styling
issues in layout.css, the booking calendar in booking.js/calendar.js, a
wording change in the matching sections/*.html file, etc. Nothing is
minified or bundled.

## Running it locally

`main.js` loads each section with `fetch()`, which browsers block on a
plain `file://` page. Serve the folder over local HTTP instead:

```bash
cd g-lashes-website
python3 -m http.server 8000
# then open http://localhost:8000
```

(Any static server works — `npx serve`, VS Code's Live Server extension, etc.)

## Deploying

This is a static site — drag the whole folder into Netlify, or push it to
GitHub Pages / Cloudflare Pages. No build command needed.

## Editing content

- **Prices/services shown on the page** (the "Treatments" list): edit
  `sections/services.html` directly.
- **Bookable services** (what shows up in the booking form's service
  picker, and what clients can actually book): these come live from the
  `services` table in Supabase, not from the HTML. Update them there —
  the row's `active` flag controls whether a service is bookable.
- **Opening hours**: `js/config.js` (`openingHour` / `closingHour`).
- **Contact details**: `js/config.js` and `sections/contact.html`.

## Photos

`assets/images/hero-lashes.jpg` and `assets/images/studio.jpg` are the
photos you provided. To swap either one later, just replace the file
(keep the same filename, or update the matching `<img src="...">` in
`sections/hero.html` / `sections/studio.html` if you rename it).

## A note on the Supabase key in js/config.js

That's a "publishable" (anon) key, not a secret — it's meant to be visible
in client-side code like this. Supabase's Row Level Security policies (not
this key) are what actually control who can read/write which rows.
Never put a "service_role" key in a front-end file.
