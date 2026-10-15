import { describe, expect, it } from 'vitest';
import type { Question } from '../types/question';
import { isValidQuestion } from './validation';

const question: Question = {
  id: 'example',
  operation: 'division',
  firstOperand: 12,
  secondOperand: 3,
  correctAnswer: 4,
  displayText: '12 ÷ 3 = ?',
  choices: [3, 4, 5, 6],
  difficulty: 1,
  source: 'regular',
};

describe('question validation', () => {
  it('rejects answer arrays with missing entries', () => {
    const sparseChoices = new Array<number>(4);
    sparseChoices[0] = 4;
    sparseChoices[1] = 5;
    sparseChoices[3] = 6;
    expect(isValidQuestion({ ...question, choices: sparseChoices })).toBe(
      false,
    );
  });

  it('accepts a complete valid question and a review question with its origin', () => {
    expect(isValidQuestion(question)).toBe(true);
    expect(
      isValidQuestion({
        ...question,
        source: 'mistake-review',
        mistakePatternId: 'pattern-1',
      }),
    ).toBe(true);
  });

  it.each([
    null,
    {},
    { ...question, id: '' },
    { ...question, operation: 'constructor' },
    { ...question, difficulty: 0 },
    { ...question, firstOperand: NaN },
    { ...question, secondOperand: 0 },
    { ...question, secondOperand: 5 },
    { ...question, correctAnswer: 9 },
    { ...question, displayText: '12 ÷ 3 = 4' },
    { ...question, choices: [4, 4, 5, 6] },
    { ...question, choices: [1, 2, 3] },
    { ...question, choices: [1, 2, 3, 5] },
    { ...question, choices: [4, 5, 6, -1] },
    { ...question, choices: [4, 5, 6, 1.5] },
    { ...question, source: 'unknown' },
    { ...question, source: 'mistake-review' },
    { ...question, mistakePatternId: '' },
  ])('rejects malformed data %#', (value) =>
    expect(isValidQuestion(value)).toBe(false),
  );

  it.each([
    {
      operation: 'addition',
      firstOperand: 11,
      secondOperand: 1,
      correctAnswer: 12,
      displayText: '11 + 1 = ?',
    },
    {
      operation: 'subtraction',
      firstOperand: 1,
      secondOperand: 2,
      correctAnswer: -1,
      displayText: '1 − 2 = ?',
    },
    {
      operation: 'multiplication',
      firstOperand: 6,
      secondOperand: 2,
      correctAnswer: 12,
      displayText: '6 × 2 = ?',
    },
    {
      operation: 'multiplication',
      difficulty: 3,
      firstOperand: 10,
      secondOperand: 10,
      correctAnswer: 100,
      displayText: '10 × 10 = ?',
    },
    {
      operation: 'multiplication',
      difficulty: 4,
      firstOperand: 9,
      secondOperand: 9,
      correctAnswer: 81,
      displayText: '9 × 9 = ?',
    },
    {
      operation: 'division',
      difficulty: 3,
      firstOperand: 156,
      secondOperand: 12,
      correctAnswer: 13,
      displayText: '156 ÷ 12 = ?',
    },
  ])('rejects arithmetic outside difficulty limits %#', (changes) => {
    const answer = changes.correctAnswer;
    expect(
      isValidQuestion({
        ...question,
        ...changes,
        choices: [answer, answer + 1, answer + 2, answer + 3],
      }),
    ).toBe(false);
  });
});
