/**
 * Client-side enhancements shared by every page:
 *  - language toggle (English / Traditional Chinese), persisted in localStorage
 *  - per-resource progress tracking, stored only in localStorage
 *
 * Everything degrades gracefully: with no JavaScript the site is a fully usable
 * English page. Nothing here sends any data off the device.
 */

const LANG_KEY = 'byods:lang';
const PROGRESS_KEY = 'byods:progress';

type Locale = 'en' | 'zh-TW';

let currentLang: Locale = 'en';

function safeGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode); feature simply won't persist */
  }
}

function readProgress(): Set<string> {
  const raw = safeGet(PROGRESS_KEY);
  if (!raw) {
    return new Set();
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((value): value is string => typeof value === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

function writeProgress(done: Set<string>): void {
  safeSet(PROGRESS_KEY, JSON.stringify([...done]));
}

/** Completed resources, stored only on this device. */
const done = readProgress();

/**
 * The set of slugs that exist in the catalog, embedded on the catalog page.
 * Used to clamp the progress count and to drop stale slugs left in storage.
 */
function knownSlugs(): Set<string> | null {
  const el = document.querySelector('[data-known-slugs]');
  if (!el || el.textContent === null || el.textContent.trim() === '') {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(el.textContent);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((value): value is string => typeof value === 'string'))
      : null;
  } catch {
    return null;
  }
}

/** Drop any stored slugs that are no longer in the catalog (when we can tell). */
function pruneStaleProgress(): void {
  const known = knownSlugs();
  if (known === null) {
    return;
  }
  let changed = false;
  for (const slug of [...done]) {
    if (!known.has(slug)) {
      done.delete(slug);
      changed = true;
    }
  }
  if (changed) {
    writeProgress(done);
  }
}

/** Completed count, never exceeding the number of real catalog entries. */
function completedCount(): number {
  const known = knownSlugs();
  if (known === null) {
    return done.size;
  }
  let count = 0;
  for (const slug of done) {
    if (known.has(slug)) {
      count += 1;
    }
  }
  return count;
}

/* ------------------------------------------------------------------ language */

function applyLang(lang: Locale): void {
  currentLang = lang;
  const root = document.documentElement;
  root.lang = lang === 'zh-TW' ? 'zh-Hant' : 'en';
  root.dataset.lang = lang;

  for (const el of document.querySelectorAll<HTMLElement>('[data-en]')) {
    const next = lang === 'zh-TW' ? el.getAttribute('data-zh') : el.getAttribute('data-en');
    if (next !== null && next.length > 0) {
      el.textContent = next;
    }
  }

  for (const input of document.querySelectorAll<HTMLInputElement>('[data-ph-en]')) {
    const next =
      lang === 'zh-TW' ? input.getAttribute('data-ph-zh') : input.getAttribute('data-ph-en');
    if (next !== null) {
      input.placeholder = next;
    }
  }

  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]')) {
    btn.setAttribute('aria-pressed', String(btn.dataset.langBtn === lang));
  }

  // Progress buttons carry their own labels (todo/done × en/zh); refresh them.
  renderAllProgress();
}

function initLang(): void {
  const stored = safeGet(LANG_KEY);
  applyLang(stored === 'zh-TW' ? 'zh-TW' : 'en');

  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-lang-btn]')) {
    btn.addEventListener('click', () => {
      const lang: Locale = btn.dataset.langBtn === 'zh-TW' ? 'zh-TW' : 'en';
      safeSet(LANG_KEY, lang);
      applyLang(lang);
    });
  }
}

/* ------------------------------------------------------------------ progress */

function renderProgressButton(btn: HTMLButtonElement): void {
  const slug = btn.dataset.progressToggle ?? '';
  const isDone = done.has(slug);
  btn.setAttribute('aria-pressed', String(isDone));
  const label = btn.querySelector<HTMLElement>('.progress-label');
  if (label) {
    const key = `${isDone ? 'done' : 'todo'}${currentLang === 'zh-TW' ? 'Zh' : 'En'}`;
    const text = label.dataset[key];
    if (text !== undefined && text.length > 0) {
      label.textContent = text;
    }
  }
}

function renderCount(): void {
  const count = completedCount();
  for (const el of document.querySelectorAll<HTMLElement>('[data-progress-count]')) {
    el.textContent = String(count);
  }
}

function renderAllProgress(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-progress-toggle]')) {
    renderProgressButton(btn);
  }
  renderCount();
}

function initProgress(): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-progress-toggle]')) {
    btn.addEventListener('click', () => {
      const slug = btn.dataset.progressToggle ?? '';
      if (done.has(slug)) {
        done.delete(slug);
      } else {
        done.add(slug);
      }
      writeProgress(done);
      renderProgressButton(btn);
      renderCount();
    });
  }
  renderAllProgress();
}

function start(): void {
  pruneStaleProgress();
  initLang();
  initProgress();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', start);
} else {
  start();
}
