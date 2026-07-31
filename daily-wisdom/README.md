# Daily Wisdom (રોજનું જ્ઞાન)

A single-page, static app that shares one life principle a day from
100 principles by Pujya Shri Rajyogi Narendraji, in Gujarati and English.

Personal/family use only: no backend, no database, no analytics, no
third-party network calls. Everything — the 100 principles and all user
progress (streak, history, language choice) — lives in this bundle and
in the browser's `localStorage` on each person's own device.

## Files

- `index.html` — all screens (language choice, onboarding, today's
  principle, Read All 100)
- `style.css` — warm/spiritual visual design, large touch-friendly UI
- `app.js` — daily rotation logic, streak tracking, rendering
- `data.js` — the 100 principles (Gujarati + English), bundled locally
- `netlify.toml` — static deploy config, no build step

## Deploying to Netlify

This folder is a subdirectory of a larger repo, so when you create the
Netlify site, set:

- **Base directory:** `daily-wisdom`
- **Build command:** (leave empty)
- **Publish directory:** `daily-wisdom` (or `.` relative to the base
  directory above)

No environment variables, functions, or build step are needed.

## How the daily principle works

On first load, a shuffled order of all 100 principle IDs is generated
and stored in `localStorage` along with today's date and a position
index. Each new local calendar date advances the index by one (looping
back to a freshly reshuffled order after all 100 have been shown), so
the same principle is shown all day regardless of refreshes, and no
principle repeats until the full set has cycled through.

## Notes on the Gujarati font

The app asks for `Noto Sans Gujarati` / `Nirmala UI` / `Shruti` as a
system font stack rather than bundling a font file, so there are zero
network requests. These are commonly preinstalled on Android, iOS, and
Windows. If you want a guaranteed identical look on every device
regardless of what's installed, a Gujarati web font file could be added
and `@font-face`'d locally — just ask.
