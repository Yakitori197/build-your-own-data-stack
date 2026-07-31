import { describe, expect, it } from 'vitest';
import { categorySchema, entrySchema, learningPathSchema } from '../lib/catalog/schema';
import { validCategory, validEntry, validLearningPath } from './fixtures';

describe('entrySchema', () => {
  it('accepts a well-formed entry', () => {
    const result = entrySchema.safeParse(validEntry());
    expect(result.success).toBe(true);
  });

  it('rejects a non-kebab slug', () => {
    const result = entrySchema.safeParse(validEntry({ slug: 'Not_Kebab' }));
    expect(result.success).toBe(false);
  });

  it('rejects unknown keys (typo protection)', () => {
    const result = entrySchema.safeParse(validEntry({ sumary: 'typo' }));
    expect(result.success).toBe(false);
  });

  it('requires a non-trivial summary', () => {
    const result = entrySchema.safeParse(validEntry({ summary: 'too short' }));
    expect(result.success).toBe(false);
  });

  it('requires at least one language', () => {
    const result = entrySchema.safeParse(validEntry({ languages: [] }));
    expect(result.success).toBe(false);
  });

  it('requires at least one learning outcome', () => {
    const result = entrySchema.safeParse(validEntry({ learningOutcomes: [] }));
    expect(result.success).toBe(false);
  });

  it('rejects an invalid difficulty', () => {
    const result = entrySchema.safeParse(validEntry({ difficulty: 'expert' }));
    expect(result.success).toBe(false);
  });

  it('rejects non-positive estimatedHours', () => {
    const result = entrySchema.safeParse(validEntry({ estimatedHours: 0 }));
    expect(result.success).toBe(false);
  });

  it('rejects a malformed lastVerified date string', () => {
    const result = entrySchema.safeParse(validEntry({ lastVerified: '2026/07/01' }));
    expect(result.success).toBe(false);
  });

  it('exposes structured issues with a path', () => {
    const result = entrySchema.safeParse(validEntry({ title: '' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join('.'));
      expect(paths).toContain('title');
    }
  });
});

describe('categorySchema', () => {
  it('accepts a bilingual category', () => {
    expect(categorySchema.safeParse(validCategory()).success).toBe(true);
  });

  it('requires both languages', () => {
    const result = categorySchema.safeParse(validCategory({ label: { en: 'Databases' } }));
    expect(result.success).toBe(false);
  });
});

describe('learningPathSchema', () => {
  it('accepts a valid path', () => {
    expect(learningPathSchema.safeParse(validLearningPath()).success).toBe(true);
  });

  it('requires at least two steps', () => {
    const result = learningPathSchema.safeParse(
      validLearningPath({ steps: [{ slug: 'build-a-toy-database' }] }),
    );
    expect(result.success).toBe(false);
  });
});
