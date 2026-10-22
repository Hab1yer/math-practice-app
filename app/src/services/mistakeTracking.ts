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

/** Apply one new event; callers must deduplicate saved attempts before replay. */
function applyEvent(
  patterns: Map<string, MistakePattern>,
  attempt: PracticeAttempt,
  masteryThreshold = 3,
) {
  const id =
    attempt.source === 'mistake-review'
      ? attempt.mistakePatternId
      : mistakePatternId(attempt);
  const existing = id ? patterns.get(id) : undefined;
  if (attempt.source === 'mistake-review' && existing) {
    if (attempt.selfReportedCorrect) {
      existing.similarCorrectCount++;
      existing.mastered = existing.similarCorrectCount >= masteryThreshold;
      return;
    }
  } else if (
    attempt.selfReportedCorrect ||
    attempt.source === 'mistake-review'
  ) {
    return;
  }
  if (existing) {
    existing.incorrectCount++;
    existing.lastIncorrectAt =
      attempt.attemptedAt > existing.lastIncorrectAt
        ? attempt.attemptedAt
        : existing.lastIncorrectAt;
    existing.similarCorrectCount = 0;
    existing.mastered = false;
  } else {
    patterns.set(mistakePatternId(attempt), {
      id: mistakePatternId(attempt),
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

export function applyMistakeAttempt(
  patterns: readonly MistakePattern[],
  attempt: PracticeAttempt,
  masteryThreshold = 3,
): MistakePattern[] {
  const result = new Map(
    patterns.map((pattern) => [pattern.id, { ...pattern }]),
  );
  applyEvent(result, attempt, masteryThreshold);
  return [...result.values()];
}

/** The attempt ledger is authoritative, including review progress and reopening. */
export function trackMistakes(
  attempts: readonly PracticeAttempt[],
  masteryThreshold = 3,
): MistakePattern[] {
  const patterns = new Map<string, MistakePattern>();
  const seen = new Set<string>();
  // Stable sorting preserves report order when several events share a timestamp.
  for (const attempt of [...attempts].sort((a, b) =>
    a.attemptedAt.localeCompare(b.attemptedAt),
  )) {
    if (seen.has(attempt.id)) continue;
    seen.add(attempt.id);
    applyEvent(patterns, attempt, masteryThreshold);
  }
  return [...patterns.values()];
}
