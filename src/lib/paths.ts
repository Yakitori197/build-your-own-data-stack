/** Build a site-root-relative URL that respects Astro's configured `base`. */
const base = import.meta.env.BASE_URL;

export function href(path: string): string {
  const trimmedBase = base.replace(/\/$/, '');
  const trimmedPath = path.replace(/^\//, '');
  return `${trimmedBase}/${trimmedPath}`;
}
