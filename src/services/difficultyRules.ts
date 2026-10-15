import type { DifficultyLevel, MathOperation } from '../types/question';

export const arithmeticSymbols: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
};

export const difficultyRules: Record<
  DifficultyLevel,
  {
    operandMax: number;
    factorMax: number;
    divisorMax: number;
    quotientMax: number;
    dividendMax: number;
  }
> = {
  1: {
    operandMax: 10,
    factorMax: 5,
    divisorMax: 5,
    quotientMax: 5,
    dividendMax: 25,
  },
  2: {
    operandMax: 50,
    factorMax: 10,
    divisorMax: 10,
    quotientMax: 10,
    dividendMax: 100,
  },
  3: {
    operandMax: 100,
    factorMax: 99,
    divisorMax: 12,
    quotientMax: 144,
    dividendMax: 144,
  },
  4: {
    operandMax: 1000,
    factorMax: 99,
    divisorMax: 99,
    quotientMax: 100,
    dividendMax: 9900,
  },
};

export function isMathOperation(value: unknown): value is MathOperation {
  return typeof value === 'string' && Object.hasOwn(arithmeticSymbols, value);
}

export function isDifficultyLevel(value: unknown): value is DifficultyLevel {
  return value === 1 || value === 2 || value === 3 || value === 4;
}
