# Privacy and security

The short version: this project collects nothing. See the root
[PRIVACY.md](../PRIVACY.md) and [SECURITY.md](../SECURITY.md) for the
user-facing statements; this document covers the engineering side.

## Privacy by construction

- **No analytics, telemetry, ads, or third-party trackers** anywhere in the code
  or the built site.
- **No backend and no accounts.** The site is static files.
- **No cookies.** The only client storage is `localStorage`, used for two things:
  the selected language (`byods:lang`) and your completed-resource list
  (`byods:progress`). Both stay in your browser and are never transmitted.
- **No API keys** are required to build, test, or run anything.
- The generated JSON feed contains only public catalog data — no personal data.

### Two different things: visitors vs. build tooling

- **Deployed site (what visitors get):** zero analytics, tracking, or
  third-party scripts. The site loads no third-party code and makes no background
  requests. This is a property of the built output itself.
- **Build/development tooling (what maintainers run):** the Astro framework has
  an anonymous, opt-out build-time telemetry feature. We explicitly **disable**
  it — `ASTRO_TELEMETRY_DISABLED=1` is set in CI and baked into the local
  `dev`/`build`/`preview`/`typecheck` npm scripts via `cross-env`, so it is off
  on Windows and Linux alike. This telemetry, when enabled, concerns the build
  tool and never runs in a visitor's browser; we turn it off regardless.

## Security practices

- **Dependencies.** `npm audit` and `npm audit --omit=dev` are expected to report
  zero vulnerabilities, and CI runs both. Dependency updates arrive via
  Dependabot. We avoid deprecated or unmaintained packages.
- **No secrets in the repo.** There are no tokens, credentials, connection
  strings, or `.env` files. Examples and tests use only fictional data.
- **External links open safely.** Outbound links use
  `rel="noopener noreferrer"`.
- **Content Security.** Because the site ships no third-party scripts or remote
  assets, its runtime attack surface is minimal.
- **Link checking** runs on a schedule to catch links that have gone stale or
  started redirecting somewhere unexpected.
- **SSRF protection.** The link checker enforces a public-URL policy on the
  initial request and every redirect target: HTTPS only, no credentials or
  non-default ports, no `localhost`/`.local`/`.internal`. DNS is validated **at
  connection time** by a pinned `lookup`, so the socket only ever connects to a
  validated public address (private/loopback/link-local/CGNAT/etc. refused) with
  no room for DNS rebinding, while the real hostname is kept for TLS SNI and
  certificate checks. See [SECURITY.md](../SECURITY.md) and
  [link-checker.md](link-checker.md).
- **No credential leakage in logs.** Any URL userinfo is stripped before logging.

## Reporting a problem

Please report suspected vulnerabilities privately as described in
[SECURITY.md](../SECURITY.md). Do not open a public issue for a security report.
