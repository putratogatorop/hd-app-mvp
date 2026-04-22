# Push this design system to GitHub

Follow these steps to get the design system up on your own GitHub repo.

---

## 1. Create an empty repo on GitHub

1. Go to [github.com/new](https://github.com/new)
2. Name it something like `haagen-dazs-indonesia-ds`
3. **Leave it empty** — no README, no .gitignore, no license (we already have them)
4. Click **Create repository**
5. Copy the repo URL, it will look like:
   `https://github.com/YOUR_USERNAME/haagen-dazs-indonesia-ds.git`

---

## 2. Download this project

Use the download link in the chat to get the `.zip`, then unzip it somewhere on your computer.

---

## 3. Push from your terminal

Open a terminal, `cd` into the unzipped folder, and run:

```bash
git init
git add .
git commit -m "Initial design system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/haagen-dazs-indonesia-ds.git
git push -u origin main
```

Replace `YOUR_USERNAME/haagen-dazs-indonesia-ds` with your actual repo path.

---

## 4. (Optional) Preview it on GitHub Pages

To see the design system live in your browser:

1. In your repo on GitHub: **Settings → Pages**
2. **Source**: Deploy from a branch → `main` → `/ (root)` → Save
3. After ~1 minute, visit:
   `https://YOUR_USERNAME.github.io/haagen-dazs-indonesia-ds/`
4. Append specific file paths to view previews, e.g.
   `/ui_kits/customer_app/index.html`
   `/preview/components-buttons.html`

---

## 5. Future updates

Once connected, any future change is just:

```bash
git add .
git commit -m "what changed"
git push
```

---

## Troubleshooting

- **"remote origin already exists"** → run `git remote remove origin` then re-add.
- **Push rejected** → your repo wasn't empty. Either start over with an empty repo, or run `git pull origin main --allow-unrelated-histories` first.
- **Permission denied** → make sure you're signed in to GitHub in your terminal (use a [personal access token](https://github.com/settings/tokens) or [GitHub CLI](https://cli.github.com/)).
