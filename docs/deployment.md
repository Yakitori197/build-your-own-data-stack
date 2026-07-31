# Deployment

The site is a plain static bundle produced by `npm run build` into `dist/`. It
can be hosted on any static host. **It is not deployed yet**; this document
describes how a maintainer would deploy it.

## Build output

```bash
npm ci
npm run build      # → dist/
npm run preview    # serve dist/ locally to sanity-check
```

`dist/` contains prebuilt HTML for every page, the CSS/JS bundles, and
`api/catalog.json`. No server runtime is needed.

## GitHub Pages (project site)

A project site is served from `https://<user>.github.io/<repo>/`, i.e. under a
subpath. Two config values must be set so links and assets resolve:

1. In [`astro.config.mjs`](../astro.config.mjs), set:

   ```js
   export default defineConfig({
     site: 'https://<user>.github.io',
     base: '/build-your-own-data-stack',
     // ...existing options
   });
   ```

   All internal links already go through the `href()` helper in
   [`src/lib/paths.ts`](../src/lib/paths.ts), which respects `base`, so no page
   edits are needed.

2. Add a deployment workflow (for example using
   `actions/upload-pages-artifact` and `actions/deploy-pages`) that runs
   `npm ci && npm run build` and publishes `dist/`. This repository intentionally
   does **not** ship an auto-deploy workflow, so nothing is published without a
   maintainer explicitly adding one and enabling Pages.

3. In the repository settings, set **Pages → Source** to "GitHub Actions".

After the first successful deploy, add the live URL to the **Demo** section of
the root `README.md`.

## Other hosts

Any static host works (Netlify, Cloudflare Pages, S3 + CDN, etc.). Point the host
at the build command `npm run build` and the output directory `dist/`. If the
site is served from the domain root, leave `base` unset.
