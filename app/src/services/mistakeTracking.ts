import type { MistakePattern } from '../types/mistake';
import type { PracticeAttempt } from '../types/session';
import { isRecord, isValidAttempt } from './storageValidation';

/** Exact ordered facts are patterns; related/reversed facts belong to later review generation. */
export function mistakePatternId(
  fact: Pick<
    PracticeAttempt,
    'operation' | 'difficulty' | 'firstOperand' | 'secondOperand'
  >,
): string {
  return JSON.stringify([
    fact.operation,
    fact.difficulty,
    fact.firstOperand,
    fact.secondOperand,
  ]);
}

export function isValidMistakePattern(value: unknown): value is MistakePattern {
  if (!isRecord(value)) return false;
  return (
    isValidAttempt({
      ...value,
      questionId: 'validation',
      sessionId: 'validation',
      attemptedAt: value.lastIncorrectAt,
      selectedAnswer: value.correctAnswer,
      selfReportedCorrect: false,
      source: 'regular',
    }) &&
    value.id === mistakePatternId(value as unknown as MistakePattern) &&
    Number.isSafeInteger(value.incorrectCount) &&
    (value.incorrectCount as number) > 0 &&
    Number.isSafeInteger(value.similarCorrectCount) &&
    (value.similarCorrectCount as number) >= 0 &&
    typeof value.mastered === 'boolean'
  );
}

/** Reconcile against unique saved attempts, making repeated persistence idempotent. */
export function trackMistakes(
  attempts: readonly PracticeAttempt[],
  previous: readonly MistakePattern[] = [],
): MistakePattern[] {
  const patterns = new Map<string, MistakePattern>();
  const seen = new Set<string>();
  for (const attempt of attempts) {
    if (seen.has(attempt.id)) continue;
    seen.add(attempt.id);
    if (attempt.selfReportedCorrect) continue;
    const id = mistakePatternId(attempt);
    const existing = patterns.get(id);
    if (existing) {
      existing.incorrectCount++;
      if (attempt.attemptedAt > existing.lastIncorrectAt)
        existing.lastIncorrectAt = attempt.attemptedAt;
    } else {
      patterns.set(id, {
        id,
        operation: attempt.operation,
        firstOperand: attempt.firstOperand,
        secondOperand: attempt.secondOperand,
        correctAnswer: attempt.correctAnswer,
        difficulty: attempt.difficulty,
        incorrectCount: 1,
        similarCorrectCount: 0,
        lastIncorrectAt: attempt.attemptedAt,
        mastered: false,
      });
    }
  }
  for (const saved of previous) {
    const current = patterns.get(saved.id);
    // Any additional miss resets mastery, even when both reports share a timestamp.
    if (
      current &&
      current.incorrectCount === saved.incorrectCount &&
      current.lastIncorrectAt === saved.lastIncorrectAt &&
      current.correctAnswer === saved.correctAnswer
    ) {
      current.similarCorrectCount = saved.similarCorrectCount;
      current.mastered = saved.mastered;
    }
  }
  return [...patterns.values()];
}
