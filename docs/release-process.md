# Release process

This project follows [Semantic Versioning](https://semver.org/) and keeps a
[Keep a Changelog](https://keepachangelog.com/)-style
[CHANGELOG.md](../CHANGELOG.md).

Because the catalog changes more often than the code, most contributions are
content updates that do not need a version bump. Versioned releases are for
notable code, schema, or tooling changes.

## What the version means

- **MAJOR** — a breaking change to the catalog schema or the public JSON feed
  format (`feed.version`).
- **MINOR** — new features (new tooling, new site capabilities) that are backward
  compatible.
- **PATCH** — fixes and content-only maintenance.

## Cutting a release (maintainers)

1. Ensure `main` is green: `npm ci`, `lint`, `typecheck`, `test`, `build`, and
   both `npm audit` variants pass.
2. `npm run catalog:generate` and confirm `git diff` is clean.
3. Move items from the `Unreleased` section of `CHANGELOG.md` under a new,
   dated version heading.
4. Bump `version` in `package.json`.
5. Commit, tag (`vX.Y.Z`), and push the tag.
6. If the site is deployed, trigger a deploy (see [deployment.md](deployment.md)).

## Feed compatibility

The JSON feed carries a `version` field. Increment it and document the change
whenever the feed's shape changes in a backward-incompatible way, and note it in
the changelog under a MAJOR release.
