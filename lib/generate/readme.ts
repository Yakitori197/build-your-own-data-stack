import type { Catalog, Entry, LearningPath } from '../catalog/types';
import {
  allLanguages,
  categoriesWithEntries,
  countEntriesByCategory,
  entriesForCategory,
  entryBySlug,
} from '../catalog/query';
import { replaceSection } from './markers';
import { escapeInline, escapeLinkDestination, escapeTableCell } from './markdown';

function formatHours(hours: number): string {
  return `~${hours}h`;
}

function entryMeta(entry: Entry): string {
  const parts = [
    entry.difficulty,
    formatHours(entry.estimatedHours),
    entry.languages.map(escapeInline).join(', '),
    entry.free ? 'free' : 'paid',
  ];
  if (entry.openSource) {
    parts.push('open source');
  }
  return parts.join(' · ');
}

function entryLine(entry: Entry): string {
  const title = escapeInline(entry.title);
  const dest = escapeLinkDestination(entry.sourceUrl);
  const summary = escapeInline(entry.summary);
  return `- **[${title}](${dest})** — ${summary} _(${entryMeta(entry)})_`;
}

/** Small stat block summarising the catalog. */
export function buildStatsSection(catalog: Catalog): string {
  const languages = allLanguages(catalog);
  return [
    `- **Entries:** ${catalog.entries.length}`,
    `- **Categories:** ${catalog.categories.length} (${categoriesWithEntries(catalog)} with at least one entry)`,
    `- **Learning paths:** ${catalog.learningPaths.length}`,
    `- **Languages covered:** ${languages.map(escapeInline).join(', ')}`,
  ].join('\n');
}

/** A table of every category with its current entry count. */
export function buildCategoriesSection(catalog: Catalog): string {
  const counts = countEntriesByCategory(catalog);
  const rows = catalog.categories.map(
    (category) =>
      `| ${escapeTableCell(category.label.en)} | ${counts.get(category.id) ?? 0} | ${escapeTableCell(category.summary.en)} |`,
  );
  return ['| Category | Entries | What you build |', '| --- | --- | --- |', ...rows].join('\n');
}

/** Ordered learning paths with their steps linked to source resources. */
export function buildLearningPathsSection(catalog: Catalog): string {
  const bySlug = entryBySlug(catalog);
  const blocks = catalog.learningPaths.map((path: LearningPath) => {
    const steps = path.steps.map((step, index) => {
      const entry = bySlug.get(step.slug);
      const label = entry
        ? `[${escapeInline(entry.title)}](${escapeLinkDestination(entry.sourceUrl)})`
        : escapeInline(step.slug);
      const note = step.note ? ` — ${escapeInline(step.note)}` : '';
      return `${index + 1}. **${label}**${note}`;
    });
    return [
      `### ${escapeInline(path.title)}`,
      '',
      escapeInline(path.summary),
      '',
      `_${path.difficulty} · ${path.steps.length} steps_`,
      '',
      ...steps,
    ].join('\n');
  });
  return blocks.join('\n\n');
}

/** The full catalog grouped by category, skipping empty categories. */
export function buildCatalogSection(catalog: Catalog): string {
  const blocks: string[] = [];
  for (const category of catalog.categories) {
    const entries = entriesForCategory(catalog, category.id);
    if (entries.length === 0) {
      continue;
    }
    blocks.push(
      [`### ${escapeInline(category.label.en)}`, '', ...entries.map(entryLine)].join('\n'),
    );
  }
  return blocks.join('\n\n');
}

export function buildReadmeSections(catalog: Catalog): Record<string, string> {
  return {
    STATS: buildStatsSection(catalog),
    CATEGORIES: buildCategoriesSection(catalog),
    LEARNING_PATHS: buildLearningPathsSection(catalog),
    CATALOG: buildCatalogSection(catalog),
  };
}

/** Apply every generated section into a README string, preserving prose. */
export function applyReadmeSections(readme: string, catalog: Catalog): string {
  let output = readme;
  for (const [name, body] of Object.entries(buildReadmeSections(catalog))) {
    output = replaceSection(output, name, body);
  }
  return output;
}
