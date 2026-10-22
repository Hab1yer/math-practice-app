import type { MistakePattern } from '../types/mistake';
import type { PracticeAttempt, PracticeConfiguration } from '../types/session';
import { generateSimilarQuestion, questionFactKey } from './similarQuestions';

export interface ReviewOptions {
  patterns: readonly MistakePattern[];
  masteryThreshold: number;
}

export function eligibleMistakes(
  patterns: readonly MistakePattern[],
  configuration: Pick<PracticeConfiguration, 'operations' | 'difficulty'>,
) {
  return patterns.filter(
    (pattern) =>
      !pattern.mastered &&
      pattern.difficulty === configuration.difficulty &&
      configuration.operations.includes(pattern.operation),
  );
}

/** Frequency, recency and remaining progress all contribute; jitter breaks close ties. */
export function reviewPriority(
  pattern: MistakePattern,
  threshold = 3,
  now = Date.now(),
): number {
  const days = Math.max(
    0,
    (now - Date.parse(pattern.lastIncorrectAt)) / 86_400_000,
  );
  return (
    Math.log2(1 + pattern.incorrectCount) * 3 +
    3 / (1 + days / 7) +
    3 * (1 - Math.min(1, pattern.similarCorrectCount / threshold))
  );
}

export function generateReviewQuestion(
  options: ReviewOptions,
  configuration: Pick<PracticeConfiguration, 'operations' | 'difficulty'>,
  attempts: readonly PracticeAttempt[] = [],
) {
  let pool = eligibleMistakes(options.patterns, configuration);
  const last = attempts.at(-1)?.mistakePatternId;
  // Alternate patterns when possible, while using priority to select the next one.
  if (pool.length > 1) pool = pool.filter((pattern) => pattern.id !== last);
  const ranked = pool
    .map((pattern) => ({
      pattern,
      score:
        reviewPriority(pattern, options.masteryThreshold) + Math.random() * 0.5,
    }))
    .sort((a, b) => b.score - a.score);
  const recentFacts = attempts.slice(-5).map(questionFactKey);
  for (const { pattern } of ranked) {
    try {
      return generateSimilarQuestion(pattern, {
        allowedOperations: configuration.operations,
        recentFacts,
      });
    } catch {
      /* Try another active pattern with a finite candidate pool. */
    }
  }
  throw new Error('No active mistake fits these choices');
}
