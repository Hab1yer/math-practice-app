import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PracticeAttempt, PracticeSessionState } from '../types/session';
import { isValidMistakePattern, trackMistakes } from './mistakeTracking';
import { createStorageService, STORAGE_KEYS } from './storageService';

afterEach(() => vi.restoreAllMocks());
const miss = (overrides: Partial<PracticeAttempt> = {}): PracticeAttempt => ({
  id: 'answer-1',
  questionId: 'question-1',
  sessionId: 'session-1',
  operation: 'addition',
  difficulty: 1,
  firstOperand: 3,
  secondOperand: 4,
  correctAnswer: 7,
  selectedAnswer: 7,
  selfReportedCorrect: false,
  source: 'regular',
  attemptedAt: '2026-10-22T10:00:00.000Z',
  ...overrides,
});
function state(attempts = [miss()]): PracticeSessionState {
  return {
    session: {
      id: 'session-1',
      startedAt: '2026-10-22T09:00:00.000Z',
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 'continuous',
      attempted: attempts.length,
      correct: attempts.filter((a) => a.selfReportedCorrect).length,
      incorrect: attempts.filter((a) => !a.selfReportedCorrect).length,
    },
    attempts,
    currentQuestion: null,
    currentQuestionIndex: attempts.length,
    isActive: false,
  };
}
const put = (data: unknown, version = 1) =>
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify({ version, data }));

describe('mistake patterns', () => {
  it('captures all required fields from the self-report even when the selected answer was correct', () => {
    const [pattern] = trackMistakes([miss()]);
    expect(pattern).toEqual({
      id: '["addition",1,3,4]',
      operation: 'addition',
      difficulty: 1,
      firstOperand: 3,
      secondOperand: 4,
      correctAnswer: 7,
      incorrectCount: 1,
      similarCorrectCount: 0,
      mastered: false,
      lastIncorrectAt: miss().attemptedAt,
    });
    expect(isValidMistakePattern(pattern)).toBe(true);
    expect(
      trackMistakes([miss({ selfReportedCorrect: true, selectedAnswer: 8 })]),
    ).toEqual([]);
  });
  it('counts distinct misses once and takes the latest timestamp regardless of order', () => {
    const later = miss({
      id: 'answer-2',
      questionId: 'question-2',
      attemptedAt: '2026-10-22T11:00:00.000Z',
    });
    const result = trackMistakes([later, miss(), later, miss()]);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      incorrectCount: 2,
      lastIncorrectAt: later.attemptedAt,
    });
  });
  it('separates operations, operand order, difficulty and nearby facts', () => {
    expect(
      trackMistakes([
        miss(),
        miss({ id: 'b', operation: 'multiplication', correctAnswer: 12 }),
        miss({ id: 'c', firstOperand: 4, secondOperand: 3 }),
        miss({ id: 'd', difficulty: 2 }),
        miss({ id: 'e', firstOperand: 2, correctAnswer: 6 }),
      ]),
    ).toHaveLength(5);
  });
  it('preserves progress on a replay but resets it on another miss at the same timestamp', () => {
    const reviews = [1, 2, 3].map((index) =>
      miss({
        id: `review-${index}`,
        questionId: `review-${index}`,
        source: 'mistake-review',
        mistakePatternId: trackMistakes([miss()])[0].id,
        selfReportedCorrect: true,
      }),
    );
    const ledger = [miss(), ...reviews];
    const previous = trackMistakes(ledger);
    expect(previous[0].mastered).toBe(true);
    expect(trackMistakes([...ledger, ...reviews])).toEqual(previous);
    expect(
      trackMistakes([...ledger, miss({ id: 'b', questionId: 'b' })])[0],
    ).toMatchObject({
      incorrectCount: 2,
      similarCorrectCount: 0,
      mastered: false,
    });
    expect(previous[0].mastered).toBe(true);
  });
  it.each([
    { incorrectCount: 0 },
    { incorrectCount: 1.5 },
    { similarCorrectCount: -1 },
    { similarCorrectCount: Infinity },
    { mastered: 'yes' },
    { lastIncorrectAt: 'yesterday' },
    { correctAnswer: 99 },
    { difficulty: 5 },
    { firstOperand: 11 },
    { id: 'wrong' },
    { operation: 'division', secondOperand: 0 },
  ])('rejects invalid stored pattern %j', (change) => {
    expect(
      isValidMistakePattern({ ...trackMistakes([miss()])[0], ...change }),
    ).toBe(false);
  });
});

describe('persisted mistake tracking', () => {
  it('saves answers and patterns together and does not recount replay, end or reload', () => {
    const store = createStorageService();
    const snapshot = state();
    store.saveSession(snapshot);
    store.saveSession(snapshot);
    store.saveSession({
      ...snapshot,
      session: { ...snapshot.session, completedAt: '2026-10-22T12:00:00.000Z' },
    });
    const reloaded = createStorageService();
    reloaded.saveSession(snapshot);
    expect(reloaded.getMistakePatterns()).toEqual(
      trackMistakes(snapshot.attempts),
    );
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.history)!).data
        .mistakePatterns,
    ).toEqual(reloaded.getMistakePatterns());
    const copy = reloaded.getMistakePatterns();
    copy[0].incorrectCount = 100;
    expect(reloaded.getMistakePatterns()[0].incorrectCount).toBe(1);
  });
  it('backfills old history without writes at startup', () => {
    const snapshot = state();
    put({ sessions: [snapshot.session], attempts: snapshot.attempts });
    const before = localStorage.getItem(STORAGE_KEYS.history);
    const store = createStorageService();
    expect(store.getMistakePatterns()).toEqual(
      trackMistakes(snapshot.attempts),
    );
    expect(store.getWarning()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(before);
    store.saveSession(snapshot);
    expect(createStorageService().getMistakePatterns()).toHaveLength(1);
  });
  it.each([
    null,
    'broken',
    [{}],
    [],
    [trackMistakes([miss()])[0], trackMistakes([miss()])[0]],
    [{ ...trackMistakes([miss()])[0], incorrectCount: 99 }],
  ])(
    'rebuilds damaged patterns while keeping valid history: %j',
    (mistakePatterns) => {
      const snapshot = state();
      put({
        sessions: [snapshot.session],
        attempts: snapshot.attempts,
        mistakePatterns,
      });
      const store = createStorageService();
      expect(store.getHistory().attempts).toEqual(snapshot.attempts);
      expect(store.getMistakePatterns()).toEqual(
        trackMistakes(snapshot.attempts),
      );
      expect(store.getWarning()).toMatch(/rebuilt/);
      store.saveSession(snapshot);
      expect(createStorageService().getWarning()).toBeNull();
    },
  );
  it('recovers quota failures without double-counting and merges a sequential second tab', () => {
    const store = createStorageService();
    store.saveSession(state());
    const other = createStorageService();
    const snapshot = state([miss(), miss({ id: 'b', questionId: 'b' })]);
    const before = localStorage.getItem(STORAGE_KEYS.history);
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Full', 'QuotaExceededError');
      });
    store.saveSession(snapshot);
    expect(store.getMistakePatterns()[0].incorrectCount).toBe(2);
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(before);
    spy.mockRestore();
    store.saveSession(snapshot);
    other.saveSession(state());
    expect(createStorageService().getMistakePatterns()[0].incorrectCount).toBe(
      2,
    );
  });
  it.each(['resetHistory', 'clearAllData'] as const)(
    'clears patterns with %s without reviving stale results',
    (method) => {
      const store = createStorageService();
      store.saveSession(state());
      expect(store.getMistakePatterns()).toHaveLength(1);
      const stale = createStorageService();
      expect(store[method]()).toBe(true);
      stale.saveSession(state());
      expect(createStorageService().getMistakePatterns()).toEqual([]);
    },
  );
  it('protects future schemas and works with unavailable storage', () => {
    put({ future: true }, 99);
    const original = localStorage.getItem(STORAGE_KEYS.history);
    const store = createStorageService();
    store.saveSession(state());
    expect(store.getMistakePatterns()).toEqual([]);
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(original);
    const denied = createStorageService(() => {
      throw new Error('Denied');
    });
    denied.saveSession(state());
    expect(denied.getMistakePatterns()).toHaveLength(1);
    expect(denied.getWarning()).toMatch(/unavailable/);
  });
});
