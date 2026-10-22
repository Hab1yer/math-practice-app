import type { MistakePattern } from '../types/mistake';
import type { MathOperation, Question } from '../types/question';
import { arithmeticSymbols } from './difficultyRules';
import { generateAnswerChoices } from './answerChoices';
import { isValidMistakePattern } from './mistakeTracking';
import { isValidQuestion } from '../utils/validation';
import { createId } from '../utils/ids';
import { randomInteger } from '../utils/math';
import { logDevelopmentError } from './developmentLog';

export type SimilarityStrategy = 'nearby' | 'reversed' | 'fact-family';
type Fact = {
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
};
export const questionFactKey = (fact: Fact) =>
  JSON.stringify([fact.operation, fact.firstOperand, fact.secondOperand]);

function relatedFacts(
  pattern: MistakePattern,
  strategy: SimilarityStrategy,
): Fact[] {
  const {
    operation,
    firstOperand: a,
    secondOperand: b,
    correctAnswer: answer,
  } = pattern;
  const fact = (op: MathOperation, x: number, y: number): Fact => ({
    operation: op,
    firstOperand: x,
    secondOperand: y,
  });
  if (strategy === 'reversed')
    return operation === 'addition' || operation === 'multiplication'
      ? [fact(operation, b, a)]
      : [];
  if (strategy === 'fact-family') {
    switch (operation) {
      case 'addition':
        return [fact('subtraction', answer, a), fact('subtraction', answer, b)];
      case 'subtraction':
        return [fact('addition', answer, b), fact('addition', b, answer)];
      case 'multiplication':
        return [fact('division', answer, a), fact('division', answer, b)];
      case 'division':
        return [
          fact('multiplication', answer, b),
          fact('multiplication', b, answer),
        ];
    }
  }
  const candidates: Fact[] = [];
  for (const offset of [-2, -1, 1, 2]) {
    if (operation === 'division') {
      // Vary the quotient or divisor, constructing exact whole-number divisions.
      candidates.push(fact(operation, (answer + offset) * b, b));
      candidates.push(fact(operation, answer * (b + offset), b + offset));
    } else {
      candidates.push(
        fact(operation, a + offset, b),
        fact(operation, a, b + offset),
      );
    }
  }
  return candidates;
}

function makeQuestion(pattern: MistakePattern, fact: Fact): Question | null {
  const { operation, firstOperand: a, secondOperand: b } = fact;
  const answer =
    operation === 'addition'
      ? a + b
      : operation === 'subtraction'
        ? a - b
        : operation === 'multiplication'
          ? a * b
          : a / b;
  // Validate arithmetic and bounds before asking the distractor service to work.
  const question: Question = {
    id: createId(),
    ...fact,
    correctAnswer: answer,
    displayText: `${a} ${arithmeticSymbols[operation]} ${b} = ?`,
    difficulty: pattern.difficulty,
    source: 'mistake-review',
    mistakePatternId: pattern.id,
    choices: [answer, answer + 1, answer + 2, answer + 3],
  };
  return isValidQuestion(question) ? question : null;
}

export interface SimilarQuestionOptions {
  allowedOperations?: readonly MathOperation[];
  recentFacts?: readonly string[];
  strategy?: SimilarityStrategy;
}

export function generateSimilarQuestion(
  pattern: MistakePattern,
  options: SimilarQuestionOptions = {},
): Question {
  if (!isValidMistakePattern(pattern))
    throw new RangeError('Choose a valid mistake pattern');
  const strategies: SimilarityStrategy[] = options.strategy
    ? [options.strategy]
    : ['nearby', 'reversed', 'fact-family'];
  const recent = new Set([
    questionFactKey(pattern),
    ...(options.recentFacts ?? []),
  ]);
  const groups = strategies.map((strategy) => {
    const unique = new Map(
      relatedFacts(pattern, strategy).map((fact) => [
        questionFactKey(fact),
        fact,
      ]),
    );
    return [...unique.values()]
      .filter(
        (fact) =>
          !options.allowedOperations ||
          options.allowedOperations.includes(fact.operation),
      )
      .map((fact) => makeQuestion(pattern, fact))
      .filter((question): question is Question => question !== null);
  });
  // Prefer a different expression; relax only the recent window if the pool is exhausted.
  const freshGroups = groups
    .map((group) => group.filter((q) => !recent.has(questionFactKey(q))))
    .filter((group) => group.length > 0);
  const available = freshGroups.length
    ? freshGroups
    : groups.filter((group) => group.length > 0);
  if (!available.length)
    throw new Error('No related question fits these choices');
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const group = available[randomInteger(0, available.length - 1)];
      const question = group[randomInteger(0, group.length - 1)];
      const result = { ...question, choices: generateAnswerChoices(question) };
      if (isValidQuestion(result)) return result;
    } catch (error) {
      logDevelopmentError('Retrying related question generation', error);
    }
  }
  // makeQuestion already validated deterministic choices; preserve the relationship and bounds.
  return available[0][0];
}
