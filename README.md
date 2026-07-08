# Job Search Command Center

A personal job-search tracker: applications, companies, recruiters, and a
unified follow-up/task system, all in one React + TypeScript app.

## Storage — Firebase (cloud sync, multi-user)

Your data lives in **Firestore** (Firebase's database), scoped per signed-in
user via **Firebase Authentication**. That means:
- Sign in with email/password (or sign up for a new account) from any device.
- Your data syncs automatically across every device you're signed into.
- Each user only ever sees their own data — enforced by the security rules
  in `firestore.rules`, not just by app logic.

### One-time Firebase console setup

The app already has your `firebaseConfig` baked in (`src/firebase.ts`), so
you don't need to touch that. Two things to do once in the
[Firebase console](https://console.firebase.google.com) for your project:

1. **Authentication → Sign-in method** → make sure **Email/Password** is
   enabled.
2. **Firestore Database → Rules** → paste in the contents of
   `firestore.rules` from this project, then click **Publish**. This locks
   each user's document to only that user — do this before putting any real
   data in, since "test mode" rules are wide open.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL it prints (usually `http://localhost:5173`).

## Deploy to GitHub Pages

### Option A — Automatic, via GitHub Actions (recommended)

1. Create a new repo on GitHub and push this folder to it:

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```

2. On GitHub, go to **Settings → Pages**, and under "Build and deployment"
   set **Source** to **GitHub Actions**.

3. That's it — the included workflow (`.github/workflows/deploy.yml`)
   builds and deploys automatically every time you push to `main`. Check
   the **Actions** tab for progress; your site will be live at
   `https://<your-username>.github.io/<your-repo>/`.

### Option B — Manual, via the `gh-pages` package

1. Push the repo to GitHub as in steps 1 above.
2. Run:

   ```bash
   npm install
   npm run deploy
   ```

   This builds the app and pushes the `dist` folder to a `gh-pages` branch.

3. On GitHub, go to **Settings → Pages**, set **Source** to **Deploy from a
   branch**, and pick the `gh-pages` branch, `/ (root)` folder.

4. Your site will be live at `https://<your-username>.github.io/<your-repo>/`
   within a minute or two.

## Updating later

- **Option A:** just `git push` — it redeploys automatically.
- **Option B:** run `npm run deploy` again after making changes.
