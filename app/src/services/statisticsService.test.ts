import { describe, expect, it } from 'vitest';
import {
  accuracy,
  calculateStatistics,
  recentSessions,
} from './statisticsService';
import type { PracticeAttempt, PracticeSession } from '../types/session';

function attempt(overrides: Partial<PracticeAttempt> = {}): PracticeAttempt {
  return {
    id: 'attempt',
    questionId: 'question',
    sessionId: 'session',
    operation: 'addition',
    difficulty: 1,
    firstOperand: 2,
    secondOperand: 3,
    correctAnswer: 5,
    selectedAnswer: 5,
    selfReportedCorrect: true,
    source: 'regular',
    attemptedAt: '2026-10-22T12:00:00.000Z',
    ...overrides,
  };
}
describe('statistics calculations', () => {
  it('returns zero totals and independent zero buckets for an empty history', () => {
    const result = calculateStatistics([]);
    expect(result).toMatchObject({ attempted: 0, correct: 0, incorrect: 0 });
    for (const bucket of [
      ...Object.values(result.byOperation),
      ...Object.values(result.byDifficulty),
    ]) {
      expect(bucket).toEqual({ attempted: 0, correct: 0, incorrect: 0 });
      expect(accuracy(bucket)).toBe(0);
    }
    expect(result.byOperation.addition).not.toBe(result.byOperation.division);
    expect(result.byDifficulty[1]).not.toBe(result.byDifficulty[2]);
  });
  it('weights by attempts and uses self reports instead of answer equality', () => {
    const attempts = [
      attempt({ selectedAnswer: 999, selfReportedCorrect: true }),
      attempt({ selfReportedCorrect: false }),
      attempt({
        operation: 'division',
        difficulty: 4,
        selfReportedCorrect: false,
      }),
      attempt({
        operation: 'multiplication',
        difficulty: 3,
        source: 'mistake-review',
      }),
    ];
    const before = structuredClone(attempts);
    attempts.forEach(Object.freeze);
    Object.freeze(attempts);
    const result = calculateStatistics(attempts);
    expect(result).toMatchObject({ attempted: 4, correct: 2, incorrect: 2 });
    expect(accuracy(result)).toBe(50);
    expect(result.byOperation.addition).toEqual({
      attempted: 2,
      correct: 1,
      incorrect: 1,
    });
    expect(result.byOperation.subtraction.attempted).toBe(0);
    expect(result.byDifficulty[3].correct).toBe(1);
    expect(result.byDifficulty[4].incorrect).toBe(1);
    expect(attempts).toEqual(before);
  });
  it.each(['addition', 'subtraction', 'multiplication', 'division'] as const)(
    'tracks every difficulty independently for %s',
    (operation) => {
      const attempts = ([1, 2, 3, 4] as const).flatMap((difficulty) => [
        attempt({ operation, difficulty }),
        attempt({ operation, difficulty, selfReportedCorrect: false }),
      ]);
      const stats = calculateStatistics(attempts);
      expect(stats.byOperation[operation]).toEqual({
        attempted: 8,
        correct: 4,
        incorrect: 4,
      });
      for (const bucket of Object.values(stats.byDifficulty))
        expect(bucket).toEqual({ attempted: 2, correct: 1, incorrect: 1 });
      expect(
        Object.values(stats.byOperation).reduce(
          (sum, bucket) => sum + bucket.attempted,
          0,
        ),
      ).toBe(stats.attempted);
    },
  );
  it.each([
    [0, 0, 0],
    [3, 2, 67],
    [3, 1, 33],
    [5, 5, 100],
    [8, 0, 0],
  ])(
    'calculates accuracy for %s attempts and %s correct',
    (attempted, correct, expected) => {
      expect(
        accuracy({ attempted, correct, incorrect: attempted - correct }),
      ).toBe(expected);
    },
  );
  it('sorts recent sessions by start time, caps results and leaves input untouched', () => {
    const sessions: PracticeSession[] = Array.from(
      { length: 105 },
      (_, index) => ({
        id: String(index).padStart(3, '0'),
        startedAt: new Date(Date.UTC(2026, 0, index + 1)).toISOString(),
        operations: ['addition'],
        difficulty: 1,
        sessionLength: 5,
        attempted: 0,
        correct: 0,
        incorrect: 0,
      }),
    );
    const original = [...sessions];
    expect(recentSessions(sessions)).toHaveLength(10);
    expect(recentSessions(sessions)[0].id).toBe('104');
    expect(recentSessions(sessions, 999)).toHaveLength(100);
    expect(recentSessions(sessions, -1)).toEqual([]);
    expect(recentSessions(sessions, NaN)).toHaveLength(10);
    expect(recentSessions([])).toEqual([]);
    expect(sessions).toEqual(original);
  });
});
