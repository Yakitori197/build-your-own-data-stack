import { describe, expect, it } from 'vitest';
import { byKey, compareStrings } from '../lib/util/sort';

describe('compareStrings', () => {
  it('orders strings and reports equality', () => {
    expect(compareStrings('a', 'b')).toBe(-1);
    expect(compareStrings('b', 'a')).toBe(1);
    expect(compareStrings('a', 'a')).toBe(0);
  });
});

describe('byKey', () => {
  it('sorts by a derived key', () => {
    const items = [{ k: 'c' }, { k: 'a' }, { k: 'b' }];
    expect([...items].sort(byKey((item) => item.k)).map((item) => item.k)).toEqual(['a', 'b', 'c']);
  });
});
