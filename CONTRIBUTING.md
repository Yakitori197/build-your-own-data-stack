# Contributing

Thanks for helping build a better learning map! Contributions of resources,
learning paths, translations, accessibility fixes, and tooling are all welcome.

By participating you agree to our [Code of Conduct](CODE_OF_CONDUCT.md).

## Ways to contribute

- **Suggest a resource** — open a
  [resource issue](../../issues/new?template=new-resource.yml), or send a PR
  adding a file under `catalog/entries/`.
- **Add a learning path** — see [docs/learning-paths.md](docs/learning-paths.md).
- **Improve the site or tooling** — bug fixes, accessibility, performance, tests.
- **Report a bug or an idea** — use the issue templates.

## Development setup

Requires Node.js 22.13+ (LTS) or 24+ and npm.

```bash
npm ci          # install exactly what package-lock.json pins
npm run dev     # local site with hot reload
```

## Adding a resource

1. Copy an existing file in `catalog/entries/` to
   `catalog/entries/<your-slug>.yaml` and fill in every field. The fields and
   rules are in [docs/catalog-schema.md](docs/catalog-schema.md) and
   [docs/content-guidelines.md](docs/content-guidelines.md).
2. Write your **own** summary — do not copy text from the source.
3. Regenerate and validate:

   ```bash
   npm run catalog:validate
   npm run catalog:generate
   ```

4. Commit the entry **and** the regenerated `README.md` / `public/api/catalog.json`.

## Before you open a PR

Please make sure all of these pass locally:

```bash
npm run lint
npm run typecheck
npm test -- --run
npm run catalog:validate
npm run build
```

CI runs the same checks on Ubuntu and Windows, plus a determinism check
(`catalog:generate` must produce no diff) and `npm audit`.

## Licensing of contributions

- Code contributions are licensed under the [MIT License](LICENSE).
- Original catalog content you contribute (summaries, categories, paths) is
  licensed under [CC BY 4.0](CONTENT_LICENSE.md).
- You must have the right to contribute what you submit. Linking to a third-party
  resource never relicenses it; only your own words in the summary are licensed
  to this project.

## Style

- TypeScript is strict; keep it that way. Prefer small, pure, testable functions.
- Run `npm run format` (Prettier) before committing.
- Core logic in `lib/` should stay framework-free and unit-tested.
