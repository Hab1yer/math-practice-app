import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateAnswerChoices, generateDistractors } from './answerChoices';
import type { ArithmeticProblem } from './answerChoices';

afterEach(() => vi.restoreAllMocks());

function problem(
  operation: ArithmeticProblem['operation'],
  a: number,
  b: number,
  correctAnswer: number,
): ArithmeticProblem {
  return { operation, firstOperand: a, secondOperand: b, correctAnswer };
}

function seededRandom(seed: number) {
  let state = seed;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

const edgeCases = [
  problem('addition', 0, 0, 0),
  problem('addition', 0, 1, 1),
  problem('addition', 1000, 1000, 2000),
  problem('subtraction', 0, 0, 0),
  problem('subtraction', 10, 10, 0),
  problem('subtraction', 1000, 999, 1),
  problem('multiplication', 0, 0, 0),
  problem('multiplication', 0, 99, 0),
  problem('multiplication', 1, 1, 1),
  problem('multiplication', 2, 2, 4),
  problem('multiplication', 99, 99, 9801),
  problem('division', 0, 1, 0),
  problem('division', 0, 99, 0),
  problem('division', 1, 1, 1),
  problem('division', 4, 2, 2),
  problem('division', 9900, 99, 100),
];

describe('answer choices', () => {
  it.each(edgeCases)(
    'constructs exactly three incorrect integers for $operation $firstOperand / $secondOperand',
    (input) => {
      vi.spyOn(Math, 'random').mockImplementation(seededRandom(52));
      for (let sample = 0; sample < 50; sample++) {
        const distractors = generateDistractors(input);
        expect(distractors).toHaveLength(3);
        expect(new Set(distractors).size).toBe(3);
        expect(distractors).not.toContain(input.correctAnswer);
        expect(
          distractors.every(
            (value) => Number.isSafeInteger(value) && value >= 0,
          ),
        ).toBe(true);
        const choices = generateAnswerChoices(input);
        expect(choices).toHaveLength(4);
        expect(new Set(choices).size).toBe(4);
        expect(
          choices.filter((value) => value === input.correctAnswer),
        ).toHaveLength(1);
      }
    },
  );

  it.each([
    [problem('addition', 27, 18, 45), [35, 55]],
    [problem('subtraction', 52, 18, 34), [24, 44]],
    [problem('multiplication', 8, 7, 56), [48, 64, 49, 63]],
    [problem('division', 56, 7, 8), [7, 9]],
  ] as const)(
    'includes relevant arithmetic mistakes for $0.operation',
    (input, mistakes) => {
      vi.spyOn(Math, 'random').mockReturnValue(0);
      const distractors = generateDistractors(input);
      expect(
        distractors.some((value) =>
          (mistakes as readonly number[]).includes(value),
        ),
      ).toBe(true);
      expect(distractors).not.toContain(input.correctAnswer);
    },
  );

  it('uses integer neighboring-divisor facts and rejects fractional alternatives', () => {
    vi.spyOn(Math, 'random').mockImplementation(seededRandom(9));
    const choices = new Set(
      Array.from({ length: 100 }, () =>
        generateDistractors(problem('division', 24, 6, 4)),
      ).flat(),
    );
    expect(choices.has(24 / 5)).toBe(false);
    expect(choices.has(24 / 7)).toBe(false);
    expect(choices.has(3)).toBe(true);
    expect(choices.has(5)).toBe(true);
    const neighboringDivisor = new Set(
      Array.from({ length: 100 }, () =>
        generateDistractors(problem('division', 24, 4, 6)),
      ).flat(),
    );
    expect(neighboringDivisor.has(8)).toBe(true);
  });

  it('keeps small-answer mistakes nearby and still handles duplicate candidates', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const distractors = generateDistractors(problem('subtraction', 1, 1, 0));
    expect(distractors.every((value) => value > 0 && value <= 3)).toBe(true);
    expect(distractors.sort()).toEqual([1, 2, 3]);
  });

  it('completes with constant randomness rather than retrying duplicate draws', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValue(0);
    for (const input of edgeCases) {
      random.mockClear();
      expect(generateAnswerChoices(input)).toHaveLength(4);
      expect(random.mock.calls.length).toBeLessThanOrEqual(20);
    }
  });

  it('reaches all four correct-answer positions with broadly balanced deterministic sampling', () => {
    vi.spyOn(Math, 'random').mockImplementation(seededRandom(123));
    const counts = [0, 0, 0, 0];
    const input = problem('multiplication', 8, 7, 56);
    for (let sample = 0; sample < 4000; sample++)
      counts[generateAnswerChoices(input).indexOf(56)]++;
    for (const count of counts) {
      expect(count).toBeGreaterThan(800);
      expect(count).toBeLessThan(1200);
    }
  });

  it('preserves the supplied arithmetic problem', () => {
    const input = Object.freeze(problem('addition', 7, 8, 15));
    const snapshot = { ...input };
    expect(generateAnswerChoices(input)).toHaveLength(4);
    expect(input).toEqual(snapshot);
  });

  it.each([
    problem('division', 10, 0, 0),
    problem('division', 10, 3, 3),
    problem('subtraction', 1, 2, -1),
    problem('addition', 2, 3, 99),
    problem('multiplication', NaN, 2, 0),
    problem('addition', 1.5, 2, 3.5),
    problem('unknown' as ArithmeticProblem['operation'], 1, 2, 3),
  ])('rejects invalid arithmetic %#', (input) =>
    expect(() => generateAnswerChoices(input)).toThrow(RangeError),
  );

  it('supports safe integer limits without unsafe or fractional choices', () => {
    const choices = generateAnswerChoices(
      problem('addition', Number.MAX_SAFE_INTEGER, 0, Number.MAX_SAFE_INTEGER),
    );
    expect(choices.every(Number.isSafeInteger)).toBe(true);
    expect(new Set(choices).size).toBe(4);
  });
});
