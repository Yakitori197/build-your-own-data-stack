/**
 * Client-side filtering and search for the catalog page.
 *
 * All entry cards are rendered server-side with data-* attributes; this script
 * only toggles their visibility, so search still shows every entry with no
 * JavaScript. No network requests, no data leaves the page.
 */

function init(): void {
  const form = document.querySelector<HTMLFormElement>('[data-filters]');
  const results = document.querySelector<HTMLElement>('[data-results]');
  if (!form || !results) {
    return;
  }

  const cards = Array.from(results.querySelectorAll<HTMLElement>('[data-entry]'));
  const empty = document.querySelector<HTMLElement>('[data-empty]');
  const visibleCount = document.querySelector<HTMLElement>('[data-visible-count]');

  const control = <T extends HTMLElement>(name: string): T | null =>
    form.querySelector<T>(`[data-filter="${name}"]`);

  const search = control<HTMLInputElement>('search');
  const category = control<HTMLSelectElement>('category');
  const difficulty = control<HTMLSelectElement>('difficulty');
  const language = control<HTMLSelectElement>('language');
  const hours = control<HTMLSelectElement>('hours');
  const free = control<HTMLInputElement>('free');
  const open = control<HTMLInputElement>('open');

  function matches(card: HTMLElement): boolean {
    const d = card.dataset;
    if (category?.value && d.category !== category.value) return false;
    if (difficulty?.value && d.difficulty !== difficulty.value) return false;
    if (language?.value && !(d.languages ?? '').split(',').includes(language.value)) return false;
    if (hours?.value && Number(d.hours) > Number(hours.value)) return false;
    if (free?.checked && d.free !== '1') return false;
    if (open?.checked && d.open !== '1') return false;
    const q = (search?.value ?? '').trim().toLowerCase();
    if (q) {
      const haystack = d.text ?? '';
      if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
    }
    return true;
  }

  function syncUrl(): void {
    try {
      const url = new URL(window.location.href);
      const apply = (key: string, value: string): void => {
        if (value) {
          url.searchParams.set(key, value);
        } else {
          url.searchParams.delete(key);
        }
      };
      apply('category', category?.value ?? '');
      apply('q', (search?.value ?? '').trim());
      window.history.replaceState({}, '', url);
    } catch {
      /* history API unavailable; not critical */
    }
  }

  function applyFilters(): void {
    let visible = 0;
    for (const card of cards) {
      const show = matches(card);
      card.hidden = !show;
      if (show) visible += 1;
    }
    if (visibleCount) visibleCount.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
    syncUrl();
  }

  function initFromUrl(): void {
    const url = new URL(window.location.href);
    const cat = url.searchParams.get('category');
    if (cat && category) category.value = cat;
    const q = url.searchParams.get('q');
    if (q && search) search.value = q;
  }

  form.addEventListener('submit', (event) => event.preventDefault());
  form.addEventListener('input', applyFilters);
  form.addEventListener('change', applyFilters);
  document.querySelector<HTMLButtonElement>('[data-reset]')?.addEventListener('click', () => {
    form.reset();
    applyFilters();
  });

  initFromUrl();
  applyFilters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
