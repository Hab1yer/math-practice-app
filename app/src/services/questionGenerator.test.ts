import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DifficultyLevel, MathOperation } from '../types/question';
import {
  generateQuestion,
  generateAdditionQuestion,
  generateSubtractionQuestion,
  generateMultiplicationQuestion,
  generateDivisionQuestion,
} from './questionGenerator';
import { isValidQuestion } from '../utils/validation';

afterEach(() => vi.restoreAllMocks());

const difficulties: DifficultyLevel[] = [1, 2, 3, 4];
const operations: MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
];
const cases = operations.flatMap((operation) =>
  difficulties.map((difficulty) => [operation, difficulty] as const),
);

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

describe('question generation', () => {
  it.each(cases)(
    'respects %s level %s across 500 reproducible samples',
    (operation, difficulty) => {
      vi.spyOn(Math, 'random').mockImplementation(
        seededRandom(124 + difficulty),
      );
      const maxOperands = [10, 50, 100, 1000][difficulty - 1];
      const ids = new Set<string>();
      for (let sample = 0; sample < 500; sample++) {
        const q = generateQuestion(operation, difficulty);
        const a = q.firstOperand;
        const b = q.secondOperand;
        ids.add(q.id);
        expect(q.operation).toBe(operation);
        expect(q.difficulty).toBe(difficulty);
        expect(q.source).toBe('regular');
        expect(isValidQuestion(q)).toBe(true);
        expect(new Set(q.choices).size).toBe(4);
        expect(
          q.choices.filter((choice) => choice === q.correctAnswer),
        ).toHaveLength(1);
        if (operation === 'addition' || operation === 'subtraction') {
          expect(a).toBeGreaterThanOrEqual(0);
          expect(a).toBeLessThanOrEqual(maxOperands);
          expect(b).toBeGreaterThanOrEqual(0);
          expect(b).toBeLessThanOrEqual(maxOperands);
          expect(q.correctAnswer).toBe(
            operation === 'addition' ? a + b : a - b,
          );
          if (operation === 'subtraction') expect(a).toBeGreaterThanOrEqual(b);
        } else if (operation === 'multiplication') {
          expect(q.correctAnswer).toBe(a * b);
          if (difficulty <= 2) {
            expect(Math.max(a, b)).toBeLessThanOrEqual(
              difficulty === 1 ? 5 : 10,
            );
          } else if (difficulty === 3) {
            expect(Math.min(a, b)).toBeLessThanOrEqual(9);
            expect(Math.max(a, b)).toBeLessThanOrEqual(99);
          } else {
            expect(a).toBeGreaterThanOrEqual(10);
            expect(a).toBeLessThanOrEqual(99);
            expect(b).toBeLessThanOrEqual(99);
          }
        } else {
          expect(b).toBeGreaterThan(0);
          expect(b).toBeLessThanOrEqual([5, 10, 12, 99][difficulty - 1]);
          expect(a).toBeLessThanOrEqual([25, 100, 144, 9900][difficulty - 1]);
          expect(a % b).toBe(0);
          expect(Number.isInteger(q.correctAnswer)).toBe(true);
          expect(q.correctAnswer).toBe(a / b);
        }
      }
      expect(ids.size).toBe(500);
    },
  );

  it.each(difficulties)(
    'reaches addition/subtraction boundaries at level %s',
    (difficulty) => {
      const max = [10, 50, 100, 1000][difficulty - 1];
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(generateAdditionQuestion(difficulty).correctAnswer).toBe(0);
      vi.mocked(Math.random).mockReturnValue(1 - Number.EPSILON);
      const addition = generateAdditionQuestion(difficulty);
      expect(addition.firstOperand).toBe(max);
      expect(addition.secondOperand).toBe(max);
      expect(addition.correctAnswer).toBe(max * 2);
      // Dispatcher, then low first operand and high second operand: subtraction must reorder them.
      vi.mocked(Math.random).mockReturnValueOnce(0).mockReturnValueOnce(0);
      const subtraction = generateSubtractionQuestion(difficulty);
      expect(subtraction.firstOperand).toBe(max);
      expect(subtraction.secondOperand).toBe(0);
      expect(subtraction.correctAnswer).toBe(max);
    },
  );

  it.each(difficulties)(
    'reaches multiplication and division boundaries at level %s',
    (difficulty) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      expect(generateMultiplicationQuestion(difficulty).correctAnswer).toBe(0);
      const zeroDivision = generateDivisionQuestion(difficulty);
      expect(zeroDivision.firstOperand).toBe(0);
      expect(zeroDivision.secondOperand).toBe(1);
      vi.mocked(Math.random).mockReturnValue(1 - Number.EPSILON);
      const multiplication = generateMultiplicationQuestion(difficulty);
      expect([
        multiplication.firstOperand,
        multiplication.secondOperand,
      ]).toEqual(
        [
          [5, 5],
          [10, 10],
          [9, 99],
          [99, 99],
        ][difficulty - 1],
      );
      const division = generateDivisionQuestion(difficulty);
      expect(division.firstOperand).toBe([25, 100, 144, 9900][difficulty - 1]);
      expect(division.secondOperand).toBe([5, 10, 12, 99][difficulty - 1]);
    },
  );

  it('supports both multiplication shapes at Intermediate and Advanced', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    for (const level of [3, 4] as const) {
      vi.mocked(Math.random)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.9);
      expect(generateMultiplicationQuestion(level).secondOperand).toBe(9);
      vi.mocked(Math.random)
        .mockReturnValueOnce(0)
        .mockReturnValueOnce(0.5)
        .mockReturnValueOnce(0.9)
        .mockReturnValueOnce(0);
      expect(generateMultiplicationQuestion(level).secondOperand).toBe(10);
    }
  });

  it('selects only enabled operations and reaches every mixed-operation option', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const selected: MathOperation[] = ['addition', 'division'];
    expect(generateQuestion(selected, 1).operation).toBe('addition');
    vi.mocked(Math.random).mockReturnValueOnce(0.99);
    expect(generateQuestion(selected, 1).operation).toBe('division');
    vi.mocked(Math.random).mockImplementation(seededRandom(42));
    expect(
      new Set(
        Array.from(
          { length: 100 },
          () => generateQuestion(operations, 2).operation,
        ),
      ),
    ).toEqual(new Set(operations));
    expect(selected).toEqual(['addition', 'division']);
  });

  it('deduplicates mixed operations before selecting', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0).mockReturnValueOnce(0.6);
    expect(
      generateQuestion(['addition', 'addition', 'division'], 1).operation,
    ).toBe('division');
  });

  it('rejects invalid input rather than silently substituting a different setup', () => {
    expect(() => generateQuestion([], 1)).toThrow(RangeError);
    expect(() => generateQuestion(['remainder' as MathOperation], 1)).toThrow(
      RangeError,
    );
    expect(() => generateQuestion('addition', 5 as DifficultyLevel)).toThrow(
      RangeError,
    );
    expect(() => generateQuestion('constructor' as MathOperation, 1)).toThrow(
      RangeError,
    );
  });

  it('recovers from a transient failure', () => {
    const random = vi
      .spyOn(Math, 'random')
      .mockReturnValue(0)
      .mockReturnValueOnce(NaN);
    const q = generateQuestion('division', 3);
    expect(isValidQuestion(q)).toBe(true);
    expect(random.mock.calls.length).toBeGreaterThan(3);
  });

  it.each(operations)(
    'bounds failed retries and returns a valid %s fallback at every level',
    (operation) => {
      const random = vi.spyOn(Math, 'random').mockReturnValue(NaN);
      for (const difficulty of difficulties) {
        random.mockClear();
        const q = generateQuestion(operation, difficulty);
        expect(random).toHaveBeenCalledTimes(3);
        expect(q.operation).toBe(operation);
        expect(q.difficulty).toBe(difficulty);
        expect(isValidQuestion(q)).toBe(true);
      }
    },
  );
});
