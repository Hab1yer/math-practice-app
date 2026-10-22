import type {
  PracticeConfiguration,
  PracticeSessionState,
} from '../types/session';
import { createId } from '../utils/ids';
import { generateQuestion, generateNextQuestion } from './questionGenerator';
import { isValidConfiguration } from './practiceConfiguration';
import { eligibleMistakes, generateReviewQuestion } from './mistakeReview';
import type { ReviewOptions } from './mistakeReview';
import { applyMistakeAttempt } from './mistakeTracking';
import { answerFeedback } from './feedback';
import { logDevelopmentError } from './developmentLog';
export { isValidConfiguration } from './practiceConfiguration';

export interface CardSubmission {
  questionId: string;
  selectedAnswer: number;
  selfReportedCorrect: boolean;
}

export function startPracticeSession(
  configuration: PracticeConfiguration,
  review?: ReviewOptions,
): PracticeSessionState {
  if (!isValidConfiguration(configuration))
    throw new RangeError('Choose a valid practice configuration');
  const reviewing = configuration.mode === 'mistake-review';
  if (reviewing && !review)
    throw new RangeError('Choose an active mistake to review');
  const operations = [...new Set(configuration.operations)];
  return {
    session: {
      id: createId(),
      mode: configuration.mode,
      startedAt: new Date().toISOString(),
      operations,
      difficulty: configuration.difficulty,
      sessionLength: configuration.sessionLength,
      attempted: 0,
      correct: 0,
      incorrect: 0,
    },
    currentQuestion: reviewing
      ? generateReviewQuestion(review!, configuration)
      : generateQuestion(operations, configuration.difficulty),
    currentQuestionIndex: 0,
    attempts: [],
    isActive: true,
    ...(reviewing
      ? {
          reviewPatterns: review!.patterns.map((pattern) => ({ ...pattern })),
          reviewMasteryThreshold: review!.masteryThreshold,
        }
      : {}),
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
  review?: ReviewOptions,
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
    ...(question.mistakePatternId
      ? { mistakePatternId: question.mistakePatternId }
      : {}),
    attemptedAt: new Date().toISOString(),
  };
  const session = {
    ...state.session,
    attempted: state.session.attempted + 1,
    correct: state.session.correct + (submission.selfReportedCorrect ? 1 : 0),
    incorrect:
      state.session.incorrect + (submission.selfReportedCorrect ? 0 : 1),
  };
  const updated: PracticeSessionState = {
    ...state,
    session,
    attempts: [...state.attempts, attempt],
    currentQuestionIndex: state.currentQuestionIndex + 1,
    selectedAnswer: undefined,
    isCardFlipped: false,
    feedback: answerFeedback(submission.selfReportedCorrect),
  };
  const reviewing = session.mode === 'mistake-review';
  const threshold =
    review?.masteryThreshold ?? state.reviewMasteryThreshold ?? 3;
  const reviewOptions = reviewing
    ? {
        patterns: applyMistakeAttempt(
          review?.patterns ?? state.reviewPatterns ?? [],
          attempt,
          threshold,
        ),
        masteryThreshold: threshold,
      }
    : undefined;
  if (reviewOptions) {
    updated.reviewPatterns = reviewOptions.patterns;
    updated.reviewMasteryThreshold = threshold;
    if (!eligibleMistakes(reviewOptions.patterns, session).length)
      return endPracticeSession({
        ...updated,
        session: { ...session, completionReason: 'mastered' },
      });
  }
  if (
    session.sessionLength !== 'continuous' &&
    session.attempted >= session.sessionLength
  )
    return endPracticeSession(updated);
  try {
    return {
      ...updated,
      currentQuestion: reviewOptions
        ? generateReviewQuestion(reviewOptions, session, updated.attempts)
        : generateNextQuestion(
            session.operations,
            session.difficulty,
            question,
          ),
    };
  } catch (error) {
    logDevelopmentError('Could not prepare the next question', error);
    return { ...updated, currentQuestion: null };
  }
}
