# Daily Wisdom (રોજનું જ્ઞાન)

A single-page, static app that shares one life principle a day from
100 principles by Pujya Shri Rajyogi Narendraji, in Gujarati and English.

Personal/family use only: no backend, no database, no analytics, no
third-party network calls. Everything — the 100 principles and all user
progress (streak, history, language choice) — lives in this bundle and
in the browser's `localStorage` on each person's own device.

## Files

- `index.html` — all screens (language choice, onboarding, install
  prompt, today's principle, Read All 100)
- `style.css` — warm/spiritual visual design, large touch-friendly UI
- `app.js` — daily rotation logic, streak tracking, install prompt, rendering
- `data.js` — the 100 principles (Gujarati + English), bundled locally
- `manifest.json` — web app manifest so the site can be installed as an app
- `sw.js` — minimal service worker: caches the app shell for offline use
- `icons/` — app icons used by the manifest and Add to Home Screen
- `netlify.toml` — static deploy config, no build step

## Deploying to Netlify

Point Netlify at this repo's root — no base/publish directory changes
needed, no build command, no environment variables, no functions.

## How the daily principle works

On first load, a shuffled order of all 100 principle IDs is generated
and stored in `localStorage` along with today's date and a position
index. Each new local calendar date advances the index by one (looping
back to a freshly reshuffled order after all 100 have been shown), so
the same principle is shown all day regardless of refreshes, and no
principle repeats until the full set has cycled through.

## Install prompt (Add to Home Screen)

The very first time someone opens the app — right after the language
choice and welcome screen — it gently asks whether they'd like to add
it to their home screen, so it opens like a regular app. This is asked
once, ever (tracked in `localStorage`), and skipped entirely if the app
is already running installed (standalone mode).

- On Android/Chrome/desktop Chrome, tapping "Add to Home Screen" uses
  the browser's native `beforeinstallprompt` flow when available.
- On iOS/iPadOS, which has no programmatic install API, the screen
  instead shows a one-line instruction: tap Share → "Add to Home Screen."
- Either way, "Not now" moves on to today's principle immediately —
  nothing is blocked or forced.

## Notes on the Gujarati font

The app asks for `Noto Sans Gujarati` / `Nirmala UI` / `Shruti` as a
system font stack rather than bundling a font file, so there are zero
network requests. These are commonly preinstalled on Android, iOS, and
Windows. If you want a guaranteed identical look on every device
regardless of what's installed, a Gujarati web font file could be added
and `@font-face`'d locally — just ask.
