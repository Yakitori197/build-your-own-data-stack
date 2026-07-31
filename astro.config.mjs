// @ts-check
import { defineConfig } from 'astro/config';

// The public site is fully static: no server runtime, no database, no accounts.
// `site` and `base` are intentionally omitted until a maintainer deploys the
// project; see docs/deployment.md for how to set them for GitHub Pages.
export default defineConfig({
  output: 'static',
  trailingSlash: 'ignore',
  build: {
    format: 'directory',
  },
  devToolbar: {
    enabled: false,
  },
});
