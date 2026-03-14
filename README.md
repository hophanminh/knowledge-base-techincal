# Knowledge Base

Documentation and knowledge articles, built with [Docusaurus](https://docusaurus.io).

## Local development

```bash
npm install
npm start
```

Open http://localhost:3000. Build for production: `npm run build`; preview: `npm run serve`.

## Deploy to GitHub Pages

The repo is set up to deploy the built site to GitHub Pages via GitHub Actions.

### One-time repository setup on GitHub

1. **Push the code** to GitHub (e.g. to a repo named `knowledgebase` under your user or org).

2. **Actions permissions**  
   In the repo: **Settings → Actions → General → Workflow permissions**  
   Select **Read and write permissions** → Save.

3. **GitHub Pages**  
   **Settings → Pages** → **Source:** “Deploy from a branch”  
   **Branch:** `gh-pages` → **Folder:** `/ (root)` → Save.

### After setup

Push to the `develop` branch (or run the workflow manually, see below). The workflow will build the site and publish the `build` folder to the `gh-pages` branch. The site will be available at:

### If you see "No runner" or the workflow doesn’t run

- **Run it manually:** In the repo go to **Actions** → select **"Deploy to GitHub Pages"** → **Run workflow** → choose branch **develop** → **Run workflow**. This creates/updates `gh-pages` without a push.
- **Enable Actions:** **Settings → Actions → General** → ensure "Allow all actions and reusable workflows" (or at least allow this repo’s workflows) is enabled.
- **Permissions:** Under **Workflow permissions**, choose **Read and write permissions** so the workflow can push to `gh-pages`.

**Site URL:** https://YOUR_USERNAME.github.io/knowledgebase/ (replace YOUR_USERNAME with your GitHub username; if you changed `baseUrl` or repo name, the path matches `baseUrl` in `docusaurus.config.ts`).
