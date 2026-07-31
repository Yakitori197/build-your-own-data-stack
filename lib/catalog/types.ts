import type { Category, Entry, LearningPath } from './schema';

export type {
  Category,
  Difficulty,
  Entry,
  LearningPath,
  LearningPathStep,
  LocalizedText,
  SourceType,
} from './schema';

/** A fully validated catalog: the shape the site and generator consume. */
export interface Catalog {
  readonly categories: Category[];
  readonly entries: Entry[];
  readonly learningPaths: LearningPath[];
}

export type IssueLevel = 'error' | 'warning';

/** A single validation finding. Errors block generation; warnings do not. */
export interface Issue {
  readonly level: IssueLevel;
  readonly code: string;
  readonly message: string;
  /** File or logical location, e.g. `entries/foo.yaml`. */
  readonly location?: string;
  /** Field path within the document, e.g. `sourceUrl`. */
  readonly path?: string;
}

/** One raw, unparsed entry document plus its source file for diagnostics. */
export interface RawEntry {
  readonly file: string;
  readonly data: unknown;
}

/** Raw catalog inputs before validation. Kept unknown so tests stay in-memory. */
export interface CatalogSources {
  readonly categories: unknown;
  readonly learningPaths: unknown;
  readonly entries: readonly RawEntry[];
}

export interface ValidationResult {
  readonly ok: boolean;
  readonly issues: Issue[];
  readonly catalog: Catalog | null;
}
