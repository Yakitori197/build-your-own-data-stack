/**
 * `npm run catalog:validate`
 *
 * Reads the on-disk catalog, runs every structural and cross-entry check, prints
 * a human-readable report, and exits non-zero when there are any errors.
 */
import { readCatalogSources, resolveCatalogDir } from '../lib/catalog/load';
import { formatIssue, validateCatalog } from '../lib/catalog/validate';

function run(): number {
  let result;
  try {
    const sources = readCatalogSources(resolveCatalogDir());
    result = validateCatalog(sources);
  } catch (error) {
    console.error(
      `Failed to read catalog: ${error instanceof Error ? error.message : String(error)}`,
    );
    return 1;
  }

  const errors = result.issues.filter((issue) => issue.level === 'error');
  const warnings = result.issues.filter((issue) => issue.level === 'warning');

  for (const issue of result.issues) {
    const line = formatIssue(issue);
    if (issue.level === 'error') {
      console.error(line);
    } else {
      console.warn(line);
    }
  }

  if (result.catalog) {
    const { entries, categories, learningPaths } = result.catalog;
    console.log(
      `\nCatalog: ${entries.length} entries · ${categories.length} categories · ${learningPaths.length} learning paths`,
    );
  }
  console.log(`${errors.length} error(s), ${warnings.length} warning(s).`);
  return errors.length > 0 ? 1 : 0;
}

process.exit(run());
