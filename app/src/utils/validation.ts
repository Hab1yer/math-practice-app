import type { Question } from '../types/question';
import {
  arithmeticSymbols,
  difficultyRules,
  isDifficultyLevel,
  isMathOperation,
} from '../services/difficultyRules';

function isWholeNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Validates the complete question contract, including operands and all four choices. */
export function isValidQuestion(value: unknown): value is Question {
  if (!value || typeof value !== 'object') return false;
  const q = value as Record<string, unknown>;
  if (!isMathOperation(q.operation) || !isDifficultyLevel(q.difficulty))
    return false;
  if (typeof q.id !== 'string' || !q.id.trim()) return false;
  if (
    !isWholeNumber(q.firstOperand) ||
    !isWholeNumber(q.secondOperand) ||
    !isWholeNumber(q.correctAnswer)
  )
    return false;
  if (q.source !== 'regular' && q.source !== 'mistake-review') return false;
  if (
    q.mistakePatternId !== undefined &&
    (typeof q.mistakePatternId !== 'string' || !q.mistakePatternId.trim())
  )
    return false;
  if (q.source === 'mistake-review' && q.mistakePatternId === undefined)
    return false;
  const a = q.firstOperand;
  const b = q.secondOperand;
  const rules = difficultyRules[q.difficulty];
  let answer: number;
  switch (q.operation) {
    case 'addition':
      if (a > rules.operandMax || b > rules.operandMax) return false;
      answer = a + b;
      break;
    case 'subtraction':
      if (a > rules.operandMax || b > rules.operandMax || a < b) return false;
      answer = a - b;
      break;
    case 'multiplication':
      if (q.difficulty <= 2) {
        if (a > rules.factorMax || b > rules.factorMax) return false;
      } else if (q.difficulty === 3) {
        if (!((a <= 9 && b <= 99) || (b <= 9 && a <= 99))) return false;
      } else if (!(
        (a >= 10 && a <= 99 && b <= 99) ||
        (b >= 10 && b <= 99 && a <= 99)
      ))
        return false;
      answer = a * b;
      break;
    case 'division':
      if (
        b === 0 ||
        b > rules.divisorMax ||
        a > rules.dividendMax ||
        a % b !== 0 ||
        a / b > rules.quotientMax
      )
        return false;
      answer = a / b;
      break;
  }
  if (q.correctAnswer !== answer) return false;
  if (q.displayText !== `${a} ${arithmeticSymbols[q.operation]} ${b} = ?`)
    return false;
  return (
    Array.isArray(q.choices) &&
    q.choices.length === 4 &&
    [...q.choices].every(isWholeNumber) &&
    new Set(q.choices).size === 4 &&
    q.choices.includes(answer)
  );
}
