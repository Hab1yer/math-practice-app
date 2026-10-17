import { afterEach, describe, expect, it, vi } from 'vitest';
import { createId } from './ids';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('createId', () => {
  it('creates distinct nonempty IDs', () => {
    const ids = Array.from({ length: 1000 }, () => createId());
    expect(new Set(ids).size).toBe(1000);
    expect(ids.every((id) => typeof id === 'string' && id.length > 0)).toBe(
      true,
    );
  });

  it('keeps fallback IDs distinct even in the same millisecond', () => {
    vi.stubGlobal('crypto', undefined);
    vi.spyOn(Date, 'now').mockReturnValue(123456);
    const ids = Array.from({ length: 100 }, () => createId());
    expect(new Set(ids).size).toBe(100);
    expect(ids.every((id) => id.startsWith('local-'))).toBe(true);
  });
});
