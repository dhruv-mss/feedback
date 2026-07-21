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
   contents of `supabase/schema.sql`. This creates a `responses` table and
   locks it down with Row Level Security: anyone can *submit* a response,
   but only a signed-in user can *read* them. The file is safe to re-run
   on a project that already has responses in it: it only adds new,
   nullable columns and never touches existing rows.

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
   It can only do what the RLS policies in `schema.sql` allow (insert
   responses, and nothing else, unless authenticated).

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
- Partial completions are saved to the respondent's own browser
  (`localStorage`) as they go, so closing the tab and coming back resumes
  where they left off. That data only reaches Supabase if they finish the
  form; someone who never returns leaves nothing in the database.
