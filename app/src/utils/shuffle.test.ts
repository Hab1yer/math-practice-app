import { afterEach, describe, expect, it, vi } from 'vitest';
import { shuffle } from './shuffle';

afterEach(() => vi.restoreAllMocks());

describe('shuffle', () => {
  it('permutes every item without changing the original', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const input = Object.freeze([1, 2, 3, 4]);
    const output = shuffle(input);
    expect(output).toEqual([2, 3, 4, 1]);
    expect([...output].sort()).toEqual([...input]);
    expect(input).toEqual([1, 2, 3, 4]);
  });

  it('handles empty and single-item arrays', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['only'])).toEqual(['only']);
  });

  it('allows swaps to keep an item in place', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1 - Number.EPSILON);
    expect(shuffle([1, 2, 3])).toEqual([1, 2, 3]);
  });
});
