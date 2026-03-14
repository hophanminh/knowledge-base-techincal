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

Push to the `main` branch. The workflow in `.github/workflows/deploy.yml` will build the site and publish the `build` folder to the `gh-pages` branch. The site will be available at:

- **https://hophanminh.github.io/knowledgebase/**

(Replace `&lt;username&gt;` with your GitHub username. If you changed `baseUrl` or use a different repo name, the path in the URL matches your `baseUrl` in `docusaurus.config.ts`.)
