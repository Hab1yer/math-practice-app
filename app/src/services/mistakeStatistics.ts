import type { MistakePattern } from '../types/mistake';
import type { PracticeAttempt } from '../types/session';
import type { MathOperation } from '../types/question';
import { calculateStatistics } from './statisticsService';

export function calculateMistakeStatistics(
  patterns: readonly MistakePattern[],
  attempts: readonly PracticeAttempt[],
) {
  const ranked = [...patterns].sort(
    (a, b) =>
      b.incorrectCount - a.incorrectCount ||
      b.lastIncorrectAt.localeCompare(a.lastIncorrectAt) ||
      a.id.localeCompare(b.id),
  );
  const operationTotals = calculateStatistics(attempts).byOperation;
  const maximum = Math.max(
    ...Object.values(operationTotals).map((total) => total.incorrect),
  );
  const mostMissedOperations = (
    Object.keys(operationTotals) as MathOperation[]
  ).filter(
    (operation) =>
      maximum > 0 && operationTotals[operation].incorrect === maximum,
  );
  const reviews = attempts.filter(
    (attempt) => attempt.source === 'mistake-review',
  );
  return {
    active: ranked.filter((pattern) => !pattern.mastered),
    mastered: ranked.filter((pattern) => pattern.mastered),
    mostMissedOperations,
    mostMissedCount: maximum,
    reviewAttempted: reviews.length,
    reviewCorrect: reviews.filter((attempt) => attempt.selfReportedCorrect)
      .length,
  };
}
