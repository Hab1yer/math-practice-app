import type {
  PracticeConfiguration,
  PracticeSessionState,
} from '../types/session';
import { createId } from '../utils/ids';
import { isDifficultyLevel, isMathOperation } from './difficultyRules';
import { generateQuestion, generateNextQuestion } from './questionGenerator';

export interface CardSubmission {
  questionId: string;
  selectedAnswer: number;
  selfReportedCorrect: boolean;
}

export function isValidConfiguration(
  value: unknown,
): value is PracticeConfiguration {
  if (!value || typeof value !== 'object') return false;
  const config = value as Record<string, unknown>;
  return (
    Array.isArray(config.operations) &&
    config.operations.length > 0 &&
    [...config.operations].every(isMathOperation) &&
    isDifficultyLevel(config.difficulty) &&
    [5, 10, 20, 'continuous'].includes(
      config.sessionLength as number | string,
    ) &&
    config.mode === 'regular'
  );
}

export function startPracticeSession(
  configuration: PracticeConfiguration,
): PracticeSessionState {
  if (!isValidConfiguration(configuration))
    throw new RangeError('Choose a valid regular practice configuration');
  const operations = [...new Set(configuration.operations)];
  return {
    session: {
      id: createId(),
      startedAt: new Date().toISOString(),
      operations,
      difficulty: configuration.difficulty,
      sessionLength: configuration.sessionLength,
      attempted: 0,
      correct: 0,
      incorrect: 0,
    },
    currentQuestion: generateQuestion(operations, configuration.difficulty),
    currentQuestionIndex: 0,
    attempts: [],
    isActive: true,
  };
}

export function endPracticeSession(
  state: PracticeSessionState,
): PracticeSessionState {
  if (!state.isActive) return state;
  return {
    ...state,
    isActive: false,
    currentQuestion: null,
    session: { ...state.session, completedAt: new Date().toISOString() },
  };
}

export function recordPracticeResult(
  state: PracticeSessionState,
  submission: CardSubmission,
): PracticeSessionState {
  const question = state.currentQuestion;
  if (
    !state.isActive ||
    !question ||
    question.id !== submission.questionId ||
    state.attempts.some(
      (attempt) => attempt.questionId === submission.questionId,
    )
  )
    return state;
  if (
    !question.choices.includes(submission.selectedAnswer) ||
    typeof submission.selfReportedCorrect !== 'boolean'
  )
    return state;
  const attempt = {
    id: createId(),
    sessionId: state.session.id,
    questionId: question.id,
    operation: question.operation,
    firstOperand: question.firstOperand,
    secondOperand: question.secondOperand,
    correctAnswer: question.correctAnswer,
    selectedAnswer: submission.selectedAnswer,
    selfReportedCorrect: submission.selfReportedCorrect,
    difficulty: question.difficulty,
    source: question.source,
    attemptedAt: new Date().toISOString(),
  };
  const session = {
    ...state.session,
    attempted: state.session.attempted + 1,
    correct: state.session.correct + (submission.selfReportedCorrect ? 1 : 0),
    incorrect:
      state.session.incorrect + (submission.selfReportedCorrect ? 0 : 1),
  };
  const updated = {
    ...state,
    session,
    attempts: [...state.attempts, attempt],
    currentQuestionIndex: state.currentQuestionIndex + 1,
  };
  if (
    session.sessionLength !== 'continuous' &&
    session.attempted >= session.sessionLength
  )
    return endPracticeSession(updated);
  try {
    return {
      ...updated,
      currentQuestion: generateNextQuestion(
        session.operations,
        session.difficulty,
        question,
      ),
    };
  } catch {
    return { ...updated, currentQuestion: null };
  }
}
