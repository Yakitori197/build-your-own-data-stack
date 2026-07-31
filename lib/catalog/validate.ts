import { basename } from 'node:path';
import type { z } from 'zod';
import { categoriesFileSchema, entrySchema, learningPathsFileSchema } from './schema';
import type { Category, Entry, LearningPath } from './schema';
import type { Catalog, CatalogSources, Issue, ValidationResult } from './types';
import { analyzeUrl } from './urls';
import { byKey } from '../util/sort';

/** Entries shorter/longer than this are almost certainly a data-entry mistake. */
export const MIN_REASONABLE_HOURS = 0.5;
export const MAX_REASONABLE_HOURS = 300;

/**
 * Validate raw catalog inputs and, when there are no errors, return a fully
 * assembled {@link Catalog}. Pure and network-free: callers supply the parsed
 * documents, which keeps this trivially unit-testable.
 */
export function validateCatalog(
  sources: CatalogSources,
  options: { now?: Date } = {},
): ValidationResult {
  const issues: Issue[] = [];
  const now = options.now ?? new Date();

  const categories = parseCategories(sources.categories, issues);
  const categoryIds = new Set(categories.map((c) => c.id));

  const { entries, entrySlugs } = parseEntries(sources.entries, categoryIds, now, issues);

  const learningPaths = parseLearningPaths(sources.learningPaths, entrySlugs, issues);

  const ok = !issues.some((issue) => issue.level === 'error');
  const catalog: Catalog | null = ok
    ? {
        categories,
        entries: [...entries].sort(byKey((e) => e.slug)),
        learningPaths,
      }
    : null;

  return { ok, issues, catalog };
}

function parseCategories(raw: unknown, issues: Issue[]): Category[] {
  const parsed = categoriesFileSchema.safeParse(raw);
  if (!parsed.success) {
    collectZodIssues(issues, parsed.error, 'categories.yaml');
    return [];
  }
  for (const id of findDuplicates(parsed.data.map((c) => c.id))) {
    issues.push({
      level: 'error',
      code: 'duplicate-category-id',
      message: `Duplicate category id "${id}".`,
      location: 'categories.yaml',
    });
  }
  return parsed.data;
}

function parseEntries(
  rawEntries: CatalogSources['entries'],
  categoryIds: ReadonlySet<string>,
  now: Date,
  issues: Issue[],
): { entries: Entry[]; entrySlugs: Set<string> } {
  const entries: Entry[] = [];
  const entrySlugs = new Set<string>();
  const slugToFile = new Map<string, string>();

  for (const raw of rawEntries) {
    const parsed = entrySchema.safeParse(raw.data);
    if (!parsed.success) {
      collectZodIssues(issues, parsed.error, raw.file);
      continue;
    }
    const entry = parsed.data;

    const expected = `${entry.slug}.yaml`;
    if (basename(raw.file) !== expected) {
      issues.push({
        level: 'warning',
        code: 'filename-slug-mismatch',
        message: `File should be named "${expected}" to match its slug.`,
        location: raw.file,
      });
    }

    if (entrySlugs.has(entry.slug)) {
      issues.push({
        level: 'error',
        code: 'duplicate-slug',
        message: `Duplicate entry slug "${entry.slug}" (already defined in ${slugToFile.get(entry.slug)}).`,
        location: raw.file,
        path: 'slug',
      });
    } else {
      entrySlugs.add(entry.slug);
      slugToFile.set(entry.slug, raw.file);
    }

    if (categoryIds.size > 0 && !categoryIds.has(entry.category)) {
      issues.push({
        level: 'error',
        code: 'unknown-category',
        message: `Unknown category "${entry.category}".`,
        location: raw.file,
        path: 'category',
      });
    }

    checkUrlField(issues, entry.sourceUrl, raw.file, 'sourceUrl');
    if (entry.sourceRepoUrl !== undefined) {
      checkUrlField(issues, entry.sourceRepoUrl, raw.file, 'sourceRepoUrl');
    }

    if (
      entry.estimatedHours < MIN_REASONABLE_HOURS ||
      entry.estimatedHours > MAX_REASONABLE_HOURS
    ) {
      issues.push({
        level: 'error',
        code: 'unreasonable-hours',
        message: `estimatedHours ${entry.estimatedHours} is outside the reasonable range [${MIN_REASONABLE_HOURS}, ${MAX_REASONABLE_HOURS}].`,
        location: raw.file,
        path: 'estimatedHours',
      });
    }

    checkLastVerified(issues, entry, raw.file, now);
    reportDuplicateList(issues, entry.tags, 'duplicate-tag', 'tags', raw.file);
    reportDuplicateList(
      issues,
      entry.languages.map((l) => l.toLowerCase()),
      'duplicate-language',
      'languages',
      raw.file,
    );

    entries.push(entry);
  }

  return { entries, entrySlugs };
}

function parseLearningPaths(
  raw: unknown,
  entrySlugs: ReadonlySet<string>,
  issues: Issue[],
): LearningPath[] {
  const parsed = learningPathsFileSchema.safeParse(raw);
  if (!parsed.success) {
    collectZodIssues(issues, parsed.error, 'learning-paths.yaml');
    return [];
  }

  const pathSlugs = new Set<string>();
  for (const path of parsed.data) {
    if (pathSlugs.has(path.slug)) {
      issues.push({
        level: 'error',
        code: 'duplicate-path-slug',
        message: `Duplicate learning path slug "${path.slug}".`,
        location: 'learning-paths.yaml',
      });
    }
    pathSlugs.add(path.slug);

    path.steps.forEach((step, index) => {
      if (!entrySlugs.has(step.slug)) {
        issues.push({
          level: 'error',
          code: 'unknown-step-reference',
          message: `Learning path "${path.slug}" step ${index + 1} references unknown entry "${step.slug}".`,
          location: 'learning-paths.yaml',
          path: `steps[${index}].slug`,
        });
      }
    });
  }
  return parsed.data;
}

function checkUrlField(issues: Issue[], url: string, location: string, field: string): void {
  const analysis = analyzeUrl(url);
  if (analysis.valid) {
    return;
  }
  const messages: Record<string, string> = {
    'not-https': `${field} must use https (found ${analysis.protocol ?? 'no protocol'}).`,
    'tracking-params': `${field} contains tracking parameters: ${analysis.trackingParams.join(', ')}.`,
    'unsafe-url': `${field} must be a plain HTTPS URL with no credentials or non-default port.`,
    'unsafe-host': `${field} points at a non-public host (localhost/.local/.internal).`,
    'unsafe-address': `${field} points at a private or reserved IP address.`,
    unparseable: `${field} is not a valid URL.`,
  };
  issues.push({
    level: 'error',
    code: `url-${analysis.reason}`,
    message: messages[analysis.reason ?? 'unparseable'] ?? `${field} is not a valid URL.`,
    location,
    path: field,
  });
}

function checkLastVerified(issues: Issue[], entry: Entry, location: string, now: Date): void {
  if (!isRealCalendarDate(entry.lastVerified)) {
    issues.push({
      level: 'error',
      code: 'invalid-date',
      message: `lastVerified "${entry.lastVerified}" is not a real calendar date.`,
      location,
      path: 'lastVerified',
    });
    return;
  }
  const parsed = Date.parse(`${entry.lastVerified}T00:00:00Z`);
  if (parsed > now.getTime()) {
    issues.push({
      level: 'warning',
      code: 'future-date',
      message: `lastVerified "${entry.lastVerified}" is in the future.`,
      location,
      path: 'lastVerified',
    });
  }
}

function reportDuplicateList(
  issues: Issue[],
  values: string[],
  code: string,
  field: string,
  location: string,
): void {
  for (const value of findDuplicates(values)) {
    issues.push({
      level: 'warning',
      code,
      message: `Duplicate value "${value}" in ${field}.`,
      location,
      path: field,
    });
  }
}

function collectZodIssues(issues: Issue[], error: z.ZodError, location: string): void {
  for (const issue of error.issues) {
    const path = issue.path.map((segment) => String(segment)).join('.');
    issues.push({
      level: 'error',
      code: `schema-${issue.code}`,
      message: issue.message,
      location,
      path: path.length > 0 ? path : undefined,
    });
  }
}

function findDuplicates<T>(items: readonly T[]): T[] {
  const seen = new Set<T>();
  const duplicates = new Set<T>();
  for (const item of items) {
    if (seen.has(item)) {
      duplicates.add(item);
    } else {
      seen.add(item);
    }
  }
  return [...duplicates];
}

/** True when a `YYYY-MM-DD` string is a real date (e.g. rejects `2026-02-30`). */
export function isRealCalendarDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match || !match[1] || !match[2] || !match[3]) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
  );
}

/** Human-readable one-line rendering of an issue for CLI output. */
export function formatIssue(issue: Issue): string {
  const scope = [issue.location, issue.path].filter(Boolean).join(' › ');
  const prefix = issue.level === 'error' ? 'ERROR' : 'WARN ';
  return `${prefix} [${issue.code}] ${scope ? `${scope}: ` : ''}${issue.message}`;
}
