# Hosting OVERDRIVE on GitHub Pages

**Owner:** `asif4517-git`
**Recommended repository:** `overdrive`
**Live URL:** <https://asif4517-git.github.io/overdrive/>
**Repository:** <https://github.com/asif4517-git/overdrive>
**Creator / Developer:** Asif — <https://asif4517-git.github.io/> · [@asif_xrk](https://instagram.com/asif_xrk) · [asifsrk4517@gmail.com](mailto:asifsrk4517@gmail.com)

> **Cannot be published from this workspace.** This environment has no access to the GitHub account, remote repository or credentials. The deployment workflow and metadata are ready; the final `git push` must be run while signed in as **asif4517-git**.

---

## 1. What is already configured

| Item | File | Status |
| --- | --- | --- |
| GitHub Actions build and deploy | `.github/workflows/deploy.yml` | Ready |
| Jekyll bypass | `public/.nojekyll` → copied to `dist/.nojekyll` | Ready |
| Single-file production build | `vite.config.ts` + `vite-plugin-singlefile` | Ready |
| Repository/live URL config | `src/overdrive/site.ts` | Ready (`overdrive`) |
| Repository description, topics, `gh` commands | `REPO_DESCRIPTION.txt` | Ready |
| Metadata script | `scripts/set-repo-metadata.sh` | Ready |
| Full developer handover | `working.txt` | Ready |
| README with Play Live badge | `README.md` | Ready |
| Metadata and structured data | `index.html` | Ready |

No backend, database, account, API key or secret is required. The game is a static `dist/index.html` with everything inlined, so it runs from any repository subpath.

---

## 2. Make sure the repository name matches

The live URL in the README, About page, footer and metadata assumes the repository name **`overdrive`**.

If you choose a different repository name, update it in these places:

1. `src/overdrive/site.ts` → `REPO_NAME`
2. `README.md` → the Play Live and Source badge links near the top
3. `index.html` → `og:url`, `<link rel="canonical">` and the JSON-LD `url` / `sameAs`
4. `GITHUB_PAGES.md` (this file)
5. `REPO_DESCRIPTION.txt`
6. `working.txt`

Then rebuild:

```bash
npm run build
git add -A
git commit -m "Update repository URLs"
git push
```

The build itself does **not** need a `base` change: it is a single HTML file using relative/inlined assets and hash routes (`#models`).

---

## 3. Create the repository and push

### 3.1 Create the repository

1. Go to <https://github.com/new>
2. **Owner:** `asif4517-git`
3. **Repository name:** `overdrive`
4. **Visibility:** Public (required for free GitHub Pages)
5. Do **not** add a README, .gitignore or licence — this project already contains them
6. Click **Create repository**

### 3.2 Push from the project folder

```bash
git init
git add .
git commit -m "OVERDRIVE — realistic browser driving game"
git branch -M main
git remote add origin https://github.com/asif4517-git/overdrive.git
git push -u origin main
```

If Git asks for a password, use a **Personal Access Token** with the `repo` scope: <https://github.com/settings/tokens> (classic token → scope `repo`). GitHub no longer accepts account passwords over HTTPS.

Or use GitHub CLI (creates the repository, sets the description, pushes and prints the URL):

```bash
gh auth login
gh repo create overdrive --public --source=. --remote=origin --push \
  --description "Realistic browser driving game by Asif. 11 cars, manual gearbox, weather, 6 circuits and a 3D garage. React + Three.js. Live: https://asif4517-git.github.io/overdrive/ · Portfolio: https://asif4517-git.github.io/ · Instagram @asif_xrk · asifsrk4517@gmail.com"
```

Then apply homepage, topics and description in one go:

```bash
chmod +x scripts/set-repo-metadata.sh
./scripts/set-repo-metadata.sh
```

Or paste the values manually from `REPO_DESCRIPTION.txt` into **About → Edit repository details**.

---

## 4. Turn on GitHub Pages

1. Open the repository → **Settings** → **Pages**
2. Under **Build and deployment → Source**, choose **GitHub Actions**
3. Open the **Actions** tab → **Deploy OVERDRIVE to GitHub Pages**
4. If it has not run automatically, click **Run workflow**

The workflow:

1. Checks out `main`
2. Installs Node 22 and runs `npm ci`
3. Type-checks with `tsc --noEmit`
4. Builds `dist/index.html`
5. Verifies the output, adds `.nojekyll` and uploads the artifact
6. Publishes it with the official GitHub Pages actions

A typical run takes 1–3 minutes.

---

## 5. Verify the deployment

Open **<https://asif4517-git.github.io/overdrive/>** and check:

- [ ] The home page loads with the car artwork and the Play Live / GitHub header links.
- [ ] **Drive now** starts a race after the countdown.
- [ ] The garage shows a draggable 3D model with front, side, rear and 3/4 views.
- [ ] **Settings → Controls** accepts a key rebind and keeps it after reload.
- [ ] The About page shows Asif's portfolio, Instagram and email links and opens them correctly.
- [ ] The footer **Play live** and **Source** links point to the correct URLs.
- [ ] Refreshing the page returns safely to the game (hash routes, no 404).
- [ ] `#models` opens the internal model studio.
- [ ] Mobile: the layout has no horizontal overflow and touch controls appear.
- [ ] The browser console has no errors.

If the page looks stale, hard-refresh (`Ctrl/Cmd + Shift + R`) or open a private window. GitHub Pages caches HTML for a few minutes.

---

## 6. Repository description and topics

Full copy-paste text: **[REPO_DESCRIPTION.txt](REPO_DESCRIPTION.txt)**.

Short description for the GitHub **About** field:

> Realistic browser driving game by Asif. 11 cars, manual gearbox, weather, 6 circuits and a 3D garage. React + Three.js. Live: https://asif4517-git.github.io/overdrive/ · Portfolio: https://asif4517-git.github.io/ · Instagram @asif_xrk · asifsrk4517@gmail.com

**Website:** `https://asif4517-git.github.io/overdrive/`

**Topics:** `driving-game`, `racing-game`, `car-simulator`, `threejs`, `react`, `typescript`, `vite`, `webgl`, `github-pages`, `browser-game`, `procedural-generation`, `game-development`, `asif4517-git`

These are the only personal details that should be represented. Do not add credentials, achievements or contact details that were not supplied by the developer.

---

## 7. Optional — host at the account root

To serve the game at **https://asif4517-git.github.io/** instead, the repository must be named `asif4517-git.github.io`. This **replaces whatever is currently served at the root**, including the existing portfolio. Only do this if that is intended.

If you keep the portfolio at the root, use the `overdrive` repository so the game lives at `/overdrive/`.

---

## 8. Custom domain (optional)

1. **Settings → Pages → Custom domain**, enter the domain (for example `overdrive.example.com`).
2. At the DNS provider, add a `CNAME` record pointing to `asif4517-git.github.io`.
3. Return to **Settings → Pages** and enable **Enforce HTTPS** once the certificate is issued.
4. If you use a custom domain, update the URLs listed in section 2.

---

## 9. Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| Workflow not listed under Actions | `.github/workflows/deploy.yml` was not committed. Confirm the dot-folder was included: `git ls-files .github`. |
| `Get Pages site failed` | **Settings → Pages → Source** is not set to **GitHub Actions**. Set it and re-run. |
| `Not Found` during deploy | Missing `pages: write` or `id-token: write` permissions, or Pages is disabled. The workflow already declares both; check repository settings. |
| `npm ci` fails | `package-lock.json` was not committed. Commit it, or run `npm install` once locally to regenerate. |
| Type-check fails in CI | Run `npx tsc --noEmit` locally and fix the reported file before pushing. |
| Build succeeds but page is blank | Open DevTools → Console. Confirm WebGL2 is available and that the deployed `index.html` is the full build (about 2.7 MB, not a Vite development template). |
| 404 on the live URL | The first deployment may still be running, or the repository name does not match `REPO_NAME`. Check the Actions log and the URL in **Settings → Pages**. |
| Fonts look different | Fonts load from Google Fonts. Offline/preview environments fall back to the local sans-serif stack; gameplay is unaffected. |
| Puppeteer warning during install | Harmless. CI sets `PUPPETEER_SKIP_DOWNLOAD=true`; Puppeteer is only used by local QA scripts. |
| Old version still showing | GitHub Pages caches HTML. Hard-refresh or use a private window. |
| Custom domain loops or shows insecure | Wait for the certificate, then enable **Enforce HTTPS**; verify the `CNAME` DNS record. |

---

## 10. Updating the live game

```bash
# make changes
npx tsc --noEmit
npm run build        # optional local check

git add -A
git commit -m "Describe the change"
git push
```

The push to `main` triggers the workflow. The Actions summary shows the run result and the Pages URL.

---

## 11. Manual fallback (if Actions are unavailable)

```bash
npm install
npm run build

git checkout --orphan gh-pages
git rm -rf .
cp -r dist/. .
touch .nojekyll
git add .
git commit -m "Deploy OVERDRIVE"
git push -u origin gh-pages --force
git checkout main
```

Then set **Settings → Pages → Source** to **Deploy from a branch**, branch `gh-pages`, folder `/ (root)`. Prefer the Actions workflow; the fallback requires rebuilding and repeating these steps manually.

---

## 12. After deployment — update the links

Once the site is live, confirm the live URL works and that these point to it:

- README → Play Live badge
- `src/overdrive/site.ts` → `LIVE_URL`
- About page and footer (they read from `site.ts`)
- `index.html` → `og:url`, canonical and JSON-LD
- GitHub repository **About → Website**

The in-game links are generated from `src/overdrive/site.ts`, so changing it there and rebuilding updates the About page and footer together.

---

**Creator / Developer:** Asif
**Portfolio:** <https://asif4517-git.github.io/>
**Instagram:** [@asif_xrk](https://instagram.com/asif_xrk)
**Email:** [asifsrk4517@gmail.com](mailto:asifsrk4517@gmail.com)
