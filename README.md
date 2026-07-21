# hoblie - clay mirror feedback

A tap-first feedback form for people who tried the Aesthetic Clay Mirror
kit, plus a simple admin page to read the responses.

- `index.html` - the form people fill out (share this link on WhatsApp)
- `admin.html` - sign-in + dashboard to read responses
- `supabase/schema.sql` - the database table + access rules

No build step. Both pages are plain HTML/CSS/JS and load the Supabase
client from a CDN at runtime.

## Setup (~5 minutes)

1. **Create a Supabase project** at [supabase.com](https://supabase.com) (free tier is fine).

2. **Run the schema.** In your project, open the SQL Editor and run the
   entire contents of `supabase/schema.sql`, top to bottom, as one query.
   This creates a `responses` table, a `save_response()` function that the
   form calls to save answers, and locks the table down with Row Level
   Security so only a signed-in user can read it. The file is safe to run
   again at any time, on a project that already has responses in it: it
   only adds new, nullable columns and replaces the function/policies,
   it never drops columns or touches existing rows. If a previous version
   of this file already ran, re-running the current one fixes it forward,
   no need to undo anything by hand first.

3. **Create the admin login.** In the Supabase dashboard go to
   **Authentication → Users → Add user**, and create:
   - Email: `dhruv@hoblie.com`
   - Password: `PLAY@0612`

   (Auto-confirm the user, or check "Auto Confirm User", no email
   verification step needed.)

4. **Wire up the credentials.** In your project go to
   **Settings → API** and copy:
   - **Project URL**
   - **anon / public key**

   Paste both into the config section near the top of the `<script>` tag
   in **both** `index.html` and `admin.html`:

   ```js
   const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
   const SUPABASE_ANON_KEY = "eyJhbGciOi...";
   ```

   The anon key is meant to be public in client-side apps like this one.
   It can only call the one function `schema.sql` grants it access to; it
   has no direct read or write access to the table at all.

5. **Host it.** Drop both files on any static host (Netlify, Vercel,
   GitHub Pages, or even just open `index.html` locally to test). Share
   the `index.html` link on WhatsApp; keep `admin.html` for yourself.

6. **View responses.** Open `admin.html`, sign in with the admin email/password
   from step 3, and browse responses, newest first, tap a card to expand it.

## Notes

- If you open `index.html` before configuring Supabase, it still works.
  Responses are saved to the browser's `localStorage` as a fallback (and a
  console warning is logged) so nothing is lost while you're testing.
- Nothing in these files is a secret except the admin password, which only
  lives in Supabase Auth (not in any file here).
- Answers save as the respondent goes, not just at the end. The moment
  someone answers their first question, a row is created in Supabase; every
  screen after that saves into the same row (matched by a random id
  generated in their browser), so someone who closes the tab halfway still
  leaves real, partial data behind. That row is marked `completed = false`
  until they hit "Done" on the final screen. `admin.html` shows in-progress
  responses with an "In progress (at ...)" tag so you can see where people
  are dropping off.
- This save-as-you-go behavior goes through a Postgres function
  (`save_response()` in `schema.sql`), not a direct table write. Postgres
  needs to be able to check "does a row with this id already exist" to
  decide whether to insert or update, and doing that under Row Level
  Security would otherwise require giving the public anon key read access
  to the whole table, exposing every respondent's answers to anyone. The
  function sidesteps that: it runs with its own elevated privileges
  internally, so the anon key that ships in the page source can call it to
  save a response but can never read the table back, directly or
  otherwise. It also refuses to touch a row once `completed = true`, so a
  finished response can't be edited again by replaying its id.
  `localStorage` is still used too, purely so a returning visitor resumes
  on the same device.
