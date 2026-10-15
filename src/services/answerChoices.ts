import type { Question } from '../types/question';
import { shuffle } from '../utils/shuffle';
import { isMathOperation } from './difficultyRules';

export type ArithmeticProblem = Pick<
  Question,
  'operation' | 'firstOperand' | 'secondOperand' | 'correctAnswer'
>;

// Bounded candidate construction avoids retry loops when facts produce duplicate answers.
const MAX_NEARBY_DISTANCE = 6;

function assertValidProblem(problem: ArithmeticProblem) {
  const {
    operation,
    firstOperand: a,
    secondOperand: b,
    correctAnswer,
  } = problem;
  if (
    !isMathOperation(operation) ||
    ![a, b, correctAnswer].every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    )
  ) {
    throw new RangeError(
      'Answer choices require supported whole-number arithmetic',
    );
  }
  const expected =
    operation === 'addition'
      ? a + b
      : operation === 'subtraction'
        ? a - b
        : operation === 'multiplication'
          ? a * b
          : b === 0
            ? NaN
            : a / b;
  if (expected !== correctAnswer)
    throw new RangeError('The supplied answer must match the problem');
}

function operationCandidates(problem: ArithmeticProblem): {
  candidates: number[];
  radius: number;
} {
  const {
    operation,
    firstOperand: a,
    secondOperand: b,
    correctAnswer: answer,
  } = problem;
  switch (operation) {
    case 'addition': {
      const carry = (a % 10) + (b % 10) >= 10;
      return {
        candidates: [answer - 10, answer + 10, Math.abs(a - b), a, b],
        radius: Math.max(
          carry ? 10 : 3,
          Math.min(10, Math.ceil(Math.max(a, b) * 0.2)),
        ),
      };
    }
    case 'subtraction': {
      const borrow = a % 10 < b % 10;
      return {
        candidates: [answer + 10, answer - 10, a + b, a, b],
        radius: Math.max(
          borrow ? 10 : 3,
          Math.min(10, Math.ceil(Math.max(a, b) * 0.2)),
        ),
      };
    }
    case 'multiplication':
      return {
        candidates: [answer - a, answer + a, answer - b, answer + b, a + b],
        radius: Math.max(3, a, b, Math.ceil(answer * 0.2)),
      };
    case 'division':
      return {
        candidates: [
          answer - 1,
          answer + 1,
          a / (b + 1),
          b > 1 ? a / (b - 1) : NaN,
          b,
          a - b,
        ],
        radius: Math.max(3, Math.ceil(answer * 0.25)),
      };
  }
}

export function generateDistractors(problem: ArithmeticProblem): number[] {
  assertValidProblem(problem);
  const { candidates, radius } = operationCandidates(problem);
  const answer = problem.correctAnswer;
  const isPlausible = (value: number) =>
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value !== answer &&
    Math.abs(value - answer) <= radius;
  // Prefer up to two fact/mistake alternatives; keep one slot for a nearby answer.
  const selected = new Set(
    shuffle([...new Set(candidates.filter(isPlausible))]).slice(0, 2),
  );
  const nearby: number[] = [];
  for (let distance = 1; distance <= MAX_NEARBY_DISTANCE; distance++) {
    for (const candidate of [answer - distance, answer + distance]) {
      if (isPlausible(candidate) && !selected.has(candidate))
        nearby.push(candidate);
    }
  }
  for (const candidate of shuffle(nearby)) {
    selected.add(candidate);
    if (selected.size === 3) break;
  }
  if (selected.size !== 3)
    throw new Error('Unable to construct three distinct incorrect choices');
  return [...selected];
}

export function generateAnswerChoices(problem: ArithmeticProblem): number[] {
  return shuffle([problem.correctAnswer, ...generateDistractors(problem)]);
}
