import type { AppSettings } from '../types/settings';
import type { MistakePattern } from '../types/mistake';
import type {
  PracticeAttempt,
  PracticeSession,
  PracticeSessionState,
} from '../types/session';
import { arithmeticSymbols } from './difficultyRules';
import { isValidConfiguration } from './practiceConfiguration';
import { isValidQuestion } from '../utils/validation';

export interface PracticeHistory {
  sessions: PracticeSession[];
  attempts: PracticeAttempt[];
  resetAt?: string;
  // Validated/reconciled independently so damaged patterns cannot erase valid answers.
  mistakePatterns?: MistakePattern[];
  activeSession?: ActiveSessionCheckpoint;
}
export type ActiveSessionCheckpoint = Omit<
  PracticeSessionState,
  'attempts' | 'reviewPatterns' | 'feedback'
>;

/** Checkpoints are recoverable independently of the answer ledger. */
export function isValidActiveSession(
  value: unknown,
  history: PracticeHistory,
): value is ActiveSessionCheckpoint {
  if (
    !isRecord(value) ||
    value.isActive !== true ||
    !isValidSession(value.session) ||
    value.session.completedAt !== undefined ||
    value.currentQuestionIndex !== value.session.attempted ||
    (value.session.sessionLength !== 'continuous' &&
      value.session.attempted >= value.session.sessionLength) ||
    (value.isCardFlipped !== undefined &&
      typeof value.isCardFlipped !== 'boolean')
  )
    return false;
  const sessionId = value.session.id;
  const saved = history.sessions.find((session) => session.id === sessionId);
  if (!saved || JSON.stringify(saved) !== JSON.stringify(value.session))
    return false;
  const question = value.currentQuestion;
  if (question === null)
    return value.selectedAnswer === undefined && !value.isCardFlipped;
  if (
    !isValidQuestion(question) ||
    question.difficulty !== saved.difficulty ||
    !saved.operations.includes(question.operation) ||
    question.source !== (saved.mode ?? 'regular') ||
    history.attempts.some((attempt) => attempt.questionId === question.id) ||
    (question.source === 'mistake-review' &&
      !history.mistakePatterns?.some(
        (pattern) => pattern.id === question.mistakePatternId,
      )) ||
    (value.selectedAnswer !== undefined &&
      !question.choices.includes(value.selectedAnswer as number)) ||
    (value.isCardFlipped && value.selectedAnswer === undefined)
  )
    return false;
  return true;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
const id = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const date = (value: unknown): value is string =>
  typeof value === 'string' &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value;

export function isValidSettings(value: unknown): value is AppSettings {
  if (!isRecord(value)) return false;
  return (
    [
      'soundEnabled',
      'cardAnimationEnabled',
      'showExplanations',
      'feedbackEffectsEnabled',
    ].every((key) => typeof value[key] === 'boolean') &&
    isValidConfiguration({
      operations: value.defaultOperations,
      difficulty: value.defaultDifficulty,
      sessionLength: value.defaultSessionLength,
      mode: 'regular',
    }) &&
    whole(value.masteryThreshold) &&
    value.masteryThreshold > 0
  );
}

export function isValidSession(value: unknown): value is PracticeSession {
  if (!isRecord(value)) return false;
  return (
    id(value.id) &&
    (value.completionReason === undefined ||
      (value.completionReason === 'mastered' &&
        value.mode === 'mistake-review' &&
        date(value.completedAt))) &&
    date(value.startedAt) &&
    (value.completedAt === undefined ||
      (date(value.completedAt) && value.completedAt >= value.startedAt)) &&
    isValidConfiguration({ ...value, mode: value.mode ?? 'regular' }) &&
    whole(value.attempted) &&
    whole(value.correct) &&
    whole(value.incorrect) &&
    value.correct + value.incorrect === value.attempted &&
    (value.sessionLength === 'continuous' ||
      value.attempted <= (value.sessionLength as number))
  );
}

export function isValidAttempt(value: unknown): value is PracticeAttempt {
  if (
    !isRecord(value) ||
    !id(value.id) ||
    !id(value.sessionId) ||
    !id(value.questionId) ||
    !date(value.attemptedAt) ||
    !whole(value.selectedAnswer) ||
    typeof value.selfReportedCorrect !== 'boolean' ||
    (value.source !== 'regular' && value.source !== 'mistake-review') ||
    (value.source === 'mistake-review' && !id(value.mistakePatternId)) ||
    (value.source === 'regular' && value.mistakePatternId !== undefined) ||
    !whole(value.correctAnswer)
  )
    return false;
  // Reuse the generator's arithmetic/difficulty validator; stored attempts do not contain choices.
  return isValidQuestion({
    ...value,
    id: value.questionId,
    source: 'regular',
    displayText: `${value.firstOperand} ${arithmeticSymbols[value.operation as keyof typeof arithmeticSymbols]} ${value.secondOperand} = ?`,
    choices: [
      value.correctAnswer,
      value.correctAnswer + 1,
      value.correctAnswer + 2,
      value.correctAnswer + 3,
    ],
  });
}

export function isValidHistory(value: unknown): value is PracticeHistory {
  if (
    !isRecord(value) ||
    (value.resetAt !== undefined && !date(value.resetAt)) ||
    !Array.isArray(value.sessions) ||
    !Array.isArray(value.attempts) ||
    ![...value.sessions].every(isValidSession) ||
    ![...value.attempts].every(isValidAttempt)
  )
    return false;
  const sessions = value.sessions as PracticeSession[];
  const attempts = value.attempts as PracticeAttempt[];
  const byId = new Map(sessions.map((session) => [session.id, session]));
  if (
    byId.size !== sessions.length ||
    new Set(attempts.map((attempt) => attempt.id)).size !== attempts.length
  )
    return false;
  const questions = new Set<string>();
  const totals = new Map<string, { attempted: number; correct: number }>();
  const origins = new Map<string, number>();
  for (const attempt of [...attempts].sort((a, b) =>
    a.attemptedAt.localeCompare(b.attemptedAt),
  )) {
    const session = byId.get(attempt.sessionId);
    const questionKey = JSON.stringify([attempt.sessionId, attempt.questionId]);
    if (
      !session ||
      questions.has(questionKey) ||
      !session.operations.includes(attempt.operation) ||
      session.difficulty !== attempt.difficulty ||
      (session.mode !== undefined && session.mode !== attempt.source) ||
      (attempt.source === 'mistake-review' &&
        origins.get(attempt.mistakePatternId!) !== attempt.difficulty) ||
      attempt.attemptedAt < session.startedAt ||
      (session.completedAt && attempt.attemptedAt > session.completedAt)
    )
      return false;
    questions.add(questionKey);
    if (attempt.source === 'regular' && !attempt.selfReportedCorrect)
      origins.set(
        JSON.stringify([
          attempt.operation,
          attempt.difficulty,
          attempt.firstOperand,
          attempt.secondOperand,
        ]),
        attempt.difficulty,
      );
    const total = totals.get(session.id) ?? { attempted: 0, correct: 0 };
    total.attempted++;
    if (attempt.selfReportedCorrect) total.correct++;
    totals.set(session.id, total);
  }
  return sessions.every(
    (session) =>
      session.attempted === (totals.get(session.id)?.attempted ?? 0) &&
      session.correct === (totals.get(session.id)?.correct ?? 0),
  );
}
