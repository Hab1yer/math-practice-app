import type { MathOperation } from '../types/question';
import type { PracticeAttempt, PracticeSessionState } from '../types/session';
import { trackMistakes } from '../services/mistakeTracking';

export function reviewMiss(
  overrides: Partial<PracticeAttempt> = {},
): PracticeAttempt {
  return {
    id: 'seed-miss',
    questionId: 'seed-question',
    sessionId: 'seed-session',
    operation: 'addition',
    firstOperand: 3,
    secondOperand: 4,
    correctAnswer: 7,
    selectedAnswer: 8,
    selfReportedCorrect: false,
    difficulty: 1,
    source: 'regular',
    attemptedAt: '2026-10-22T09:00:01.000Z',
    ...overrides,
  };
}
export function reviewPattern(operation: MathOperation = 'addition') {
  const operands =
    operation === 'division'
      ? [12, 3, 4]
      : operation === 'multiplication'
        ? [3, 4, 12]
        : operation === 'subtraction'
          ? [7, 3, 4]
          : [3, 4, 7];
  return trackMistakes([
    reviewMiss({
      operation,
      firstOperand: operands[0],
      secondOperand: operands[1],
      correctAnswer: operands[2],
    }),
  ])[0];
}
export function seedReviewState(
  attempts = [reviewMiss()],
): PracticeSessionState {
  return {
    session: {
      id: 'seed-session',
      mode: 'regular',
      startedAt: '2026-10-22T09:00:00.000Z',
      completedAt: '2026-10-22T09:01:00.000Z',
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 5,
      attempted: attempts.length,
      correct: attempts.filter((attempt) => attempt.selfReportedCorrect).length,
      incorrect: attempts.filter((attempt) => !attempt.selfReportedCorrect)
        .length,
    },
    attempts,
    currentQuestion: null,
    currentQuestionIndex: attempts.length,
    isActive: false,
  };
}
