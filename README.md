# hoblie - feedback forms

Two tap-first feedback forms sharing the same design system and Supabase
project, each with its own table so the data never mixes:

- `index.html` + `admin.html` + `supabase/schema.sql` - the Aesthetic Clay
  Mirror kit feedback form, for people who tried the kit at Samridhi's
  Co Create Jam.
- `community.html` + `community-admin.html` + `supabase/community_schema.sql` -
  the community outreach form, for existing Amazon/Blinkit customers.
  Identifies respondents by a tracking key in the URL instead of asking
  for name/phone/email.

No build step. All pages are plain HTML/CSS/JS and load the Supabase
client from a CDN at runtime.

## Setup (~5 minutes)

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

2. **Run the schema(s).** In your project, open the SQL Editor and run the
   entire contents of `supabase/schema.sql`, top to bottom, as one query.
   If you're also using the community form, do the same with
   `supabase/community_schema.sql` (they're independent, order doesn't
   matter). Each creates its own table, a `save_*()` function the form
   calls to save answers, and locks the table down with Row Level Security
   so only a signed-in user can read it. Both files are safe to run again
   at any time: they only add new, nullable columns and replace the
   function/policies, never drop columns or touch existing rows. If a
   previous version already ran, re-running the current one fixes it
   forward, no need to undo anything by hand first.

3. **Create the admin login.** In the Supabase dashboard go to
   **Authentication → Users → Add user**, and create:
   - Email: `dhruv@hoblie.com`
   - Password: `PLAY@0612`

   (Auto-confirm the user, or check "Auto Confirm User", no email
   verification step needed.) This one login works for both admin pages.

4. **Wire up the credentials.** In your project go to
   **Settings → API** and copy:
   - **Project URL**
   - **anon / public key**

   Paste both into the config section near the top of the `<script>` tag
   in **every** HTML file you're using (`index.html`, `admin.html`, and/or
   `community.html`, `community-admin.html`):

   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```

   The anon key is meant to be public in client-side apps like this one.
   It can only call the one function each schema grants it access to; it
   has no direct read or write access to either table at all.

5. **Host it.** Drop the files on any static host (Netlify, Vercel,
   GitHub Pages, or even just open the HTML files locally to test). Share
   the form link(s) with respondents; keep the admin pages for yourself.

6. **View responses.** Open the matching admin page, sign in with the
   admin email/password from step 3, and browse responses, newest first,
   tap a card to expand it.

## The community form's tracking key

`community.html` doesn't collect name, phone, or email. Instead, append a
key to the link before sending it out, e.g. `community.html?key=CUST1234`
(also accepts `?k=`, `?ref=`, `?id=`, or just a bare `community.html?CUST1234`
with no parameter name at all). Whatever value is there gets saved on every
response as `source_key`, so a completed or even partial response can be
matched back to whoever you sent that specific link to, on your end. If
the link is opened with no key at all, `source_key` is just left empty,
the form still works fine.

## Notes

- If you open a form before configuring Supabase, it still works.
  Responses are saved to the browser's `localStorage` as a fallback (and a
  console warning is logged) so nothing is lost while you're testing.
- Nothing in these files is a secret except the admin password, which only
  lives in Supabase Auth (not in any file here).
- Answers save as the respondent goes, not just at the end. The moment
  someone answers their first question, a row is created in Supabase; every
  screen after that saves into the same row (matched by a random id
  generated in their browser), so someone who closes the tab halfway still
  leaves real, partial data behind. That row is marked `completed = false`
  until they reach the end. Both admin pages show in-progress responses
  with an "In progress (at ...)" tag so you can see where people are
  dropping off.
- This save-as-you-go behavior goes through a Postgres function
  (`save_response()` / `save_community_response()`), not a direct table
  write. Postgres needs to be able to check "does a row with this id
  already exist" to decide whether to insert or update, and doing that
  under Row Level Security would otherwise require giving the public anon
  key read access to the whole table, exposing every respondent's answers
  to anyone. The function sidesteps that: it runs with its own elevated
  privileges internally, so the anon key that ships in the page source can
  call it to save a response but can never read the table back, directly
  or otherwise. It also refuses to touch a row once `completed = true`, so
  a finished response can't be edited again by replaying its id.
  `localStorage` is still used too, purely so a returning visitor resumes
  on the same device.
