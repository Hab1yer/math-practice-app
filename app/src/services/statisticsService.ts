import type { PracticeAttempt, PracticeSession } from '../types/session';
import type { AppStatistics, OperationStatistics } from '../types/statistics';

const empty = (): OperationStatistics => ({
  attempted: 0,
  correct: 0,
  incorrect: 0,
});

/** All scoring follows the child's report, regardless of the selected answer. */
export function calculateStatistics(
  attempts: readonly PracticeAttempt[],
): AppStatistics {
  const result: AppStatistics = {
    ...empty(),
    byOperation: {
      addition: empty(),
      subtraction: empty(),
      multiplication: empty(),
      division: empty(),
    },
    byDifficulty: { 1: empty(), 2: empty(), 3: empty(), 4: empty() },
  };
  for (const attempt of attempts) {
    for (const bucket of [
      result,
      result.byOperation[attempt.operation],
      result.byDifficulty[attempt.difficulty],
    ]) {
      bucket.attempted++;
      if (attempt.selfReportedCorrect) bucket.correct++;
      else bucket.incorrect++;
    }
  }
  return result;
}

export function accuracy(totals: OperationStatistics): number {
  return totals.attempted
    ? Math.round((totals.correct / totals.attempted) * 100)
    : 0;
}

export function recentSessions(
  sessions: readonly PracticeSession[],
  limit = 10,
) {
  const count = Number.isSafeInteger(limit)
    ? Math.max(0, Math.min(limit, 100))
    : 10;
  return [...sessions]
    .sort(
      (a, b) =>
        b.startedAt.localeCompare(a.startedAt) || b.id.localeCompare(a.id),
    )
    .slice(0, count);
}
