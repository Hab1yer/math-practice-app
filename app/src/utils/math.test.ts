import { afterEach, describe, expect, it, vi } from 'vitest';
import { randomInteger } from './math';

afterEach(() => vi.restoreAllMocks());

describe('randomInteger', () => {
  it('includes both endpoints and supports negative and single-value ranges', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(randomInteger(2, 9)).toBe(2);
    expect(randomInteger(-5, -1)).toBe(-5);
    vi.mocked(Math.random).mockReturnValue(1 - Number.EPSILON);
    expect(randomInteger(2, 9)).toBe(9);
    expect(randomInteger(7, 7)).toBe(7);
  });

  it.each([
    [5, 2],
    [0.5, 2],
    [0, Infinity],
    [-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  ])('rejects invalid bounds %s to %s', (min, max) => {
    expect(() => randomInteger(min, max)).toThrow(RangeError);
  });

  it.each([NaN, -0.1, 1, Infinity])(
    'rejects an invalid random value %s',
    (random) => {
      vi.spyOn(Math, 'random').mockReturnValue(random);
      expect(() => randomInteger(0, 10)).toThrow(RangeError);
    },
  );
});
