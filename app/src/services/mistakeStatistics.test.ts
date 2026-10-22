import { describe, expect, it } from 'vitest';
import { calculateMistakeStatistics } from './mistakeStatistics';
import { reviewMiss, reviewPattern } from '../test/reviewFixtures';

describe('advanced statistics', () => {
  it('has an empty state without inventing a most-missed operation', () => {
    expect(calculateMistakeStatistics([], [])).toMatchObject({
      active: [],
      mastered: [],
      mostMissedOperations: [],
      reviewAttempted: 0,
      reviewCorrect: 0,
    });
  });
  it('reports operation ties, ranks facts deterministically and separates mastery', () => {
    const addition = { ...reviewPattern(), incorrectCount: 3 };
    const division = {
      ...reviewPattern('division'),
      incorrectCount: 3,
      lastIncorrectAt: '2026-10-22T11:00:00.000Z',
    };
    const mastered = { ...reviewPattern('subtraction'), mastered: true };
    const attempts = [
      reviewMiss(),
      reviewMiss({ id: 'division', operation: 'division' }),
      reviewMiss({
        id: 'review-right',
        source: 'mistake-review',
        selfReportedCorrect: true,
        mistakePatternId: addition.id,
      }),
      reviewMiss({
        id: 'review-wrong',
        source: 'mistake-review',
        operation: 'division',
        mistakePatternId: division.id,
      }),
    ];
    // Add another addition miss to tie the two actually presented operations.
    attempts.push(reviewMiss({ id: 'addition-2' }));
    const stats = calculateMistakeStatistics(
      [addition, mastered, division],
      attempts,
    );
    expect(stats.active.map((pattern) => pattern.id)).toEqual([
      division.id,
      addition.id,
    ]);
    expect(stats.mastered).toEqual([mastered]);
    expect(stats.mostMissedOperations).toEqual(['addition', 'division']);
    expect(stats.reviewAttempted).toBe(2);
    expect(stats.reviewCorrect).toBe(1);
    expect(addition.mastered).toBe(false);
  });
});
