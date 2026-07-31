import { z } from 'zod';

/** Kebab-case identifier, e.g. `storage-engines`. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Lower-case tag, allows digits and single hyphens between words. */
export const TAG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Strict calendar date, `YYYY-MM-DD`. */
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

export const SOURCE_TYPES = [
  'tutorial',
  'series',
  'book',
  'course',
  'article',
  'paper',
  'project',
  'video',
  'interactive',
  'reference',
] as const;
export type SourceType = (typeof SOURCE_TYPES)[number];

/** Bilingual text block used by categories and UI-facing content. */
export const localizedTextSchema = z.object({
  en: z.string().min(1),
  'zh-TW': z.string().min(1),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

/**
 * A single catalog entry: one hands-on, "build it yourself" resource.
 *
 * Unknown keys are rejected so that renamed or misspelled fields surface during
 * validation instead of being silently dropped.
 */
export const entrySchema = z.strictObject({
  slug: z.string().regex(SLUG_PATTERN),
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(40).max(600),
  category: z.string().min(1),
  difficulty: z.enum(DIFFICULTIES),
  languages: z.array(z.string().trim().min(1)).min(1),
  estimatedHours: z.number().positive().max(1000),
  sourceUrl: z.string().min(1),
  sourceType: z.enum(SOURCE_TYPES),
  free: z.boolean(),
  openSource: z.boolean(),
  prerequisites: z.array(z.string().trim().min(1)),
  learningOutcomes: z.array(z.string().trim().min(1)).min(1),
  tags: z.array(z.string().regex(TAG_PATTERN)).min(1),
  lastVerified: z.string().regex(DATE_PATTERN),
  authors: z.array(z.string().trim().min(1)).optional(),
  sourceRepoUrl: z.string().optional(),
});
export type Entry = z.infer<typeof entrySchema>;

/** One ordered step in a learning path, referencing an entry by slug. */
export const learningPathStepSchema = z.strictObject({
  slug: z.string().regex(SLUG_PATTERN),
  note: z.string().trim().min(1).optional(),
});
export type LearningPathStep = z.infer<typeof learningPathStepSchema>;

export const learningPathSchema = z.strictObject({
  slug: z.string().regex(SLUG_PATTERN),
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(40).max(600),
  difficulty: z.enum(DIFFICULTIES),
  steps: z.array(learningPathStepSchema).min(2),
  tags: z.array(z.string().regex(TAG_PATTERN)).min(1),
});
export type LearningPath = z.infer<typeof learningPathSchema>;

/** Category metadata is bilingual and lives in `catalog/categories.yaml`. */
export const categorySchema = z.strictObject({
  id: z.string().regex(SLUG_PATTERN),
  label: localizedTextSchema,
  summary: localizedTextSchema,
});
export type Category = z.infer<typeof categorySchema>;

export const categoriesFileSchema = z.array(categorySchema).min(1);
export const learningPathsFileSchema = z.array(learningPathSchema).min(1);
