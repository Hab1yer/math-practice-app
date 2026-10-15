/** Inclusive integer bounds; rejects invalid ranges instead of silently rounding. */
export function randomInteger(min: number, max: number): number {
  if (
    !Number.isSafeInteger(min) ||
    !Number.isSafeInteger(max) ||
    min > max ||
    !Number.isSafeInteger(max - min + 1)
  ) {
    throw new RangeError('Expected an ordered, safe integer range');
  }
  const random = Math.random();
  if (!Number.isFinite(random) || random < 0 || random >= 1) {
    throw new RangeError('Random source must return a number from 0 up to 1');
  }
  return min + Math.floor(random * (max - min + 1));
}
