# Content guidelines

The catalog is only as good as its entries. These rules keep it accurate,
original, and respectful of the resources it points to.

## What belongs here

A good entry is a **real, public, hands-on** resource for building a piece of
data or AI infrastructure from first principles: a tutorial, a from-scratch
online book, a university course with implementation projects, a foundational
paper you can implement from, or an open-source teaching project.

A resource should be:

- **Real and reachable.** A public URL that resolves over HTTPS. If you cannot
  verify it, do not add it.
- **On topic.** It should help someone _build_ or deeply _understand_ how a
  component works, not merely use a product.
- **Honestly labelled.** `free` means free to access. Paid resources are welcome
  but must be `free: false`. Never mark paid content as free.

## Writing the summary

- **Write it yourself.** One or two sentences in your own words. Do **not** copy
  the source's own description, abstract, or marketing copy.
- Describe what the reader will _build_ or _understand_, concretely.
- Keep it between 40 and 600 characters.

Summaries are original content and are licensed CC BY 4.0 (see
[CONTENT_LICENSE.md](../CONTENT_LICENSE.md)). By contributing you agree to license
your summary under those terms. The linked resource itself remains under its own
author's license — listing it here does not relicense it.

## Choosing metadata

- **`difficulty`** — judge the prerequisites, not the length. Something short but
  conceptually deep is `advanced`.
- **`estimatedHours`** — a realistic, focused time to complete, not a guess at the
  reading time.
- **`languages`** — the language(s) a learner writes. For language-neutral papers
  or concept pieces, use `Language-agnostic`.
- **`tags`** — a few lower-case kebab tokens that aid search (e.g. `b-tree`,
  `inverted-index`).
- **`lastVerified`** — the date you last confirmed the link resolves and the
  content still matches this entry. Update it whenever you re-check.

## Images and assets

Do not add images or assets whose source or license you cannot confirm. The site
prefers CSS, text, and hand-made SVG icons over third-party imagery.

## Checklist before opening a PR

```bash
npm run catalog:validate   # must pass with no errors
npm run catalog:generate   # regenerate README + feed
npm test -- --run          # unit tests
```

- [ ] The URL is HTTPS and free of tracking parameters.
- [ ] The summary is your own words.
- [ ] `free` / `openSource` are accurate.
- [ ] The file is named `entries/<slug>.yaml` to match its slug.
- [ ] `npm run catalog:validate` reports no errors.
