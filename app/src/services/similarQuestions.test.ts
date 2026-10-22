import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateSimilarQuestion, questionFactKey } from './similarQuestions';
import { isValidQuestion } from '../utils/validation';
import { reviewPattern } from '../test/reviewFixtures';
import { difficultyRules } from './difficultyRules';

afterEach(() => vi.restoreAllMocks());
describe('related question generation', () => {
  it.each(
    (
      ['addition', 'subtraction', 'multiplication', 'division'] as const
    ).flatMap((operation) =>
      ([1, 2, 3, 4] as const).map(
        (difficulty) => [operation, difficulty] as const,
      ),
    ),
  )('respects %s boundaries at level %i', (operation, difficulty) => {
    const rules = difficultyRules[difficulty];
    const a =
      operation === 'division'
        ? Math.min(
            rules.quotientMax,
            Math.floor(rules.dividendMax / rules.divisorMax),
          ) * rules.divisorMax
        : operation === 'multiplication'
          ? difficulty === 3
            ? 9
            : rules.factorMax
          : rules.operandMax;
    const b =
      operation === 'division'
        ? rules.divisorMax
        : operation === 'multiplication'
          ? rules.factorMax
          : rules.operandMax;
    const correctAnswer =
      operation === 'addition'
        ? a + b
        : operation === 'subtraction'
          ? a - b
          : operation === 'multiplication'
            ? a * b
            : a / b;
    const pattern = {
      ...reviewPattern(operation),
      difficulty,
      firstOperand: a,
      secondOperand: b,
      correctAnswer,
      id: JSON.stringify([operation, difficulty, a, b]),
    };
    for (let sample = 0; sample < 20; sample++) {
      const question = generateSimilarQuestion(pattern);
      expect(isValidQuestion(question)).toBe(true);
      expect(question.difficulty).toBe(difficulty);
      expect(question.mistakePatternId).toBe(pattern.id);
    }
  });
  it.each(['addition', 'subtraction', 'multiplication', 'division'] as const)(
    'generates valid nearby %s questions with linked provenance',
    (operation) => {
      const pattern = reviewPattern(operation);
      for (let index = 0; index < 100; index++) {
        const question = generateSimilarQuestion(pattern, {
          strategy: 'nearby',
        });
        expect(isValidQuestion(question)).toBe(true);
        expect(question).toMatchObject({
          source: 'mistake-review',
          mistakePatternId: pattern.id,
          difficulty: pattern.difficulty,
          operation,
        });
        expect(questionFactKey(question)).not.toBe(questionFactKey(pattern));
      }
    },
  );
  it.each(['addition', 'multiplication'] as const)(
    'reverses %s operands',
    (operation) => {
      expect(
        generateSimilarQuestion(reviewPattern(operation), {
          strategy: 'reversed',
        }),
      ).toMatchObject({ firstOperand: 4, secondOperand: 3, operation });
    },
  );
  it.each(['subtraction', 'division'] as const)(
    'never reverses %s as an equivalent fact',
    (operation) => {
      expect(() =>
        generateSimilarQuestion(reviewPattern(operation), {
          strategy: 'reversed',
        }),
      ).toThrow();
    },
  );
  it.each([
    ['addition', 'subtraction'],
    ['subtraction', 'addition'],
    ['multiplication', 'division'],
    ['division', 'multiplication'],
  ] as const)('creates an inverse fact from %s to %s', (original, inverse) => {
    const question = generateSimilarQuestion(reviewPattern(original), {
      strategy: 'fact-family',
    });
    expect(question.operation).toBe(inverse);
    expect(isValidQuestion(question)).toBe(true);
  });
  it('avoids the recent expression even with a constant random source', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const pattern = reviewPattern();
    const first = generateSimilarQuestion(pattern, {
      allowedOperations: ['addition'],
    });
    const second = generateSimilarQuestion(pattern, {
      allowedOperations: ['addition'],
      recentFacts: [questionFactKey(first)],
    });
    expect(questionFactKey(second)).not.toBe(questionFactKey(first));
    expect(second.operation).toBe('addition');
  });
});
