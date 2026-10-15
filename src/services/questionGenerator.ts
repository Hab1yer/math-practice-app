import type {
  DifficultyLevel,
  MathOperation,
  Question,
} from '../types/question';
import { randomInteger } from '../utils/math';
import { shuffle } from '../utils/shuffle';
import { createId } from '../utils/ids';
import { isValidQuestion } from '../utils/validation';
import {
  arithmeticSymbols,
  difficultyRules,
  isDifficultyLevel,
  isMathOperation,
} from './difficultyRules';

const MAX_GENERATION_ATTEMPTS = 3;

function generateOperands(
  operation: MathOperation,
  difficulty: DifficultyLevel,
): [number, number] {
  const rules = difficultyRules[difficulty];
  switch (operation) {
    case 'addition':
      return [
        randomInteger(0, rules.operandMax),
        randomInteger(0, rules.operandMax),
      ];
    case 'subtraction': {
      const a = randomInteger(0, rules.operandMax);
      const b = randomInteger(0, rules.operandMax);
      return [Math.max(a, b), Math.min(a, b)];
    }
    case 'multiplication':
      if (difficulty <= 2)
        return [
          randomInteger(0, rules.factorMax),
          randomInteger(0, rules.factorMax),
        ];
      return [
        randomInteger(difficulty === 4 ? 10 : 0, difficulty === 4 ? 99 : 9),
        randomInteger(0, 1) === 0 ? randomInteger(0, 9) : randomInteger(10, 99),
      ];
    case 'division': {
      const divisor = randomInteger(1, rules.divisorMax);
      const quotient = randomInteger(
        0,
        Math.min(rules.quotientMax, Math.floor(rules.dividendMax / divisor)),
      );
      return [divisor * quotient, divisor];
    }
  }
}

function buildQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  operands: [number, number],
  fallback = false,
): Question {
  const [a, b] = operands;
  const correctAnswer =
    operation === 'addition'
      ? a + b
      : operation === 'subtraction'
        ? a - b
        : operation === 'multiplication'
          ? a * b
          : a / b;
  // Basic neighboring choices satisfy the contract; Phase 5 adds operation-specific distractors.
  const choices = [
    correctAnswer,
    correctAnswer + 1,
    correctAnswer + 2,
    correctAnswer === 0 ? 3 : correctAnswer - 1,
  ];
  return {
    id: createId(),
    operation,
    firstOperand: a,
    secondOperand: b,
    displayText: `${a} ${arithmeticSymbols[operation]} ${b} = ?`,
    correctAnswer,
    choices: fallback ? choices : shuffle(choices),
    difficulty,
    source: 'regular',
  };
}

export function generateQuestion(
  operations: MathOperation | readonly MathOperation[],
  difficulty: DifficultyLevel,
): Question {
  const selected: unknown[] =
    typeof operations === 'string'
      ? [operations]
      : Array.isArray(operations)
        ? [...new Set(operations)]
        : [];
  if (!selected.length || !selected.every(isMathOperation))
    throw new RangeError('Choose at least one supported operation');
  if (!isDifficultyLevel(difficulty))
    throw new RangeError('Choose a difficulty from 1 to 4');

  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      const operation = selected[randomInteger(0, selected.length - 1)];
      const question = buildQuestion(
        operation,
        difficulty,
        generateOperands(operation, difficulty),
      );
      if (isValidQuestion(question)) return question;
    } catch {
      // Retry transient generation failures a bounded number of times.
    }
  }
  const operation = selected[0];
  const operands: [number, number] =
    operation === 'division'
      ? [0, 1]
      : operation === 'multiplication' && difficulty === 4
        ? [10, 1]
        : [0, 0];
  const fallback = buildQuestion(operation, difficulty, operands, true);
  if (!isValidQuestion(fallback))
    throw new Error('Unable to generate a valid question');
  return fallback;
}

export const generateAdditionQuestion = (difficulty: DifficultyLevel) =>
  generateQuestion('addition', difficulty);
export const generateSubtractionQuestion = (difficulty: DifficultyLevel) =>
  generateQuestion('subtraction', difficulty);
export const generateMultiplicationQuestion = (difficulty: DifficultyLevel) =>
  generateQuestion('multiplication', difficulty);
export const generateDivisionQuestion = (difficulty: DifficultyLevel) =>
  generateQuestion('division', difficulty);
