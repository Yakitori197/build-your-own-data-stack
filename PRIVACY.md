# Privacy

**This project collects nothing about you.**

The website is a set of static files. There is no backend, no database, and no
account system, so there is nowhere for your data to be sent or stored on our
side.

## What runs in your browser

- **No analytics, telemetry, advertising, or third-party trackers.** None. The
  site loads no third-party scripts and makes no background network requests.
- **No cookies.**
- **Local storage, on your device only.** Two small values are saved in your
  browser's `localStorage` and never leave it:
  - `byods:lang` — your chosen interface language.
  - `byods:progress` — the list of resources you have marked as done.

  You can clear these any time via your browser's site-data controls; doing so
  simply resets your language and progress.

## Outbound links

The catalog links to third-party websites. When you follow a link you are subject
to that site's own privacy practices, which we do not control. Links open with
`rel="noopener noreferrer"`.

## Building and running

Nothing here requires an API key or any credential to build, test, or run.

The Astro framework used to build the site has an optional, anonymous build-time
telemetry feature. This project **disables** it (`ASTRO_TELEMETRY_DISABLED=1`) in
CI and in the local `dev`/`build`/`preview` scripts, so it does not run during
development or continuous integration. This only ever concerned the build tool on
a maintainer's machine — it is never part of the site visitors load — and we turn
it off anyway. See [docs/privacy-and-security.md](docs/privacy-and-security.md).

## Changes

If this policy ever changes, the change will be recorded in
[CHANGELOG.md](CHANGELOG.md).
