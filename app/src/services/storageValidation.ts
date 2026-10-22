import type { AppSettings } from '../types/settings';
import type { PracticeAttempt, PracticeSession } from '../types/session';
import { arithmeticSymbols } from './difficultyRules';
import { isValidConfiguration } from './practiceSession';
import { isValidQuestion } from '../utils/validation';

export interface PracticeHistory {
  sessions: PracticeSession[];
  attempts: PracticeAttempt[];
  resetAt?: string;
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
    date(value.startedAt) &&
    (value.completedAt === undefined ||
      (date(value.completedAt) && value.completedAt >= value.startedAt)) &&
    isValidConfiguration({ ...value, mode: 'regular' }) &&
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
  for (const attempt of attempts) {
    const session = byId.get(attempt.sessionId);
    const questionKey = JSON.stringify([attempt.sessionId, attempt.questionId]);
    if (
      !session ||
      questions.has(questionKey) ||
      !session.operations.includes(attempt.operation) ||
      session.difficulty !== attempt.difficulty ||
      attempt.attemptedAt < session.startedAt ||
      (session.completedAt && attempt.attemptedAt > session.completedAt)
    )
      return false;
    questions.add(questionKey);
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
