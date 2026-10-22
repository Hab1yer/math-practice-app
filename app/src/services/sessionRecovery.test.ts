import { afterEach, describe, expect, it, vi } from 'vitest';
import { createStorageService, STORAGE_KEYS } from './storageService';
import {
  startPracticeSession,
  recordPracticeResult,
  endPracticeSession,
} from './practiceSession';

afterEach(() => vi.restoreAllMocks());
const begin = () =>
  startPracticeSession({
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
    mode: 'regular',
  });
describe('active-card checkpoints', () => {
  it('restores the exact shuffled question, selection and reveal without counting an answer', () => {
    const store = createStorageService();
    const state = begin();
    state.selectedAnswer = state.currentQuestion!.choices[2];
    state.isCardFlipped = true;
    store.saveSession(state);
    const restored = createStorageService().getActiveSession()!;
    expect(restored.currentQuestion).toEqual(state.currentQuestion);
    expect(restored.selectedAnswer).toBe(state.selectedAnswer);
    expect(restored.isCardFlipped).toBe(true);
    expect(restored.attempts).toEqual([]);
    const data = JSON.parse(localStorage.getItem(STORAGE_KEYS.history)!).data;
    expect(data.activeSession.attempts).toBeUndefined();
    expect(data.activeSession.reviewPatterns).toBeUndefined();
  });
  it('restores answered attempts from the ledger once and clears the checkpoint on completion', () => {
    const store = createStorageService();
    let state = begin();
    state = recordPracticeResult(state, {
      questionId: state.currentQuestion!.id,
      selectedAnswer: state.currentQuestion!.choices[0],
      selfReportedCorrect: false,
    });
    store.saveSession(state);
    const restored = createStorageService().getActiveSession()!;
    expect(restored.attempts).toEqual(state.attempts);
    expect(restored.currentQuestionIndex).toBe(1);
    store.saveSession(endPracticeSession(restored));
    expect(createStorageService().getActiveSession()).toBeNull();
    store.saveSession(state);
    expect(createStorageService().getActiveSession()).toBeNull();
  });
  it.each(['question', 'selection', 'flip', 'counts'])(
    'drops only a damaged %s checkpoint',
    (field) => {
      const store = createStorageService();
      store.saveSession(begin());
      const envelope = JSON.parse(localStorage.getItem(STORAGE_KEYS.history)!);
      const checkpoint = envelope.data.activeSession;
      if (field === 'question') checkpoint.currentQuestion.correctAnswer = -1;
      if (field === 'selection') checkpoint.selectedAnswer = -2;
      if (field === 'flip') checkpoint.isCardFlipped = true;
      if (field === 'counts') checkpoint.currentQuestionIndex = 99;
      localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(envelope));
      const restored = createStorageService();
      expect(restored.getActiveSession()).toBeNull();
      expect(restored.getHistory().sessions).toHaveLength(1);
      expect(restored.getWarning()).toMatch(/unfinished card/);
    },
  );
  it('keeps the last durable card on quota failure and protects reset from stale saves', () => {
    const store = createStorageService();
    const state = begin();
    store.saveSession(state);
    const old = localStorage.getItem(STORAGE_KEYS.history);
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Full', 'QuotaExceededError');
      });
    store.saveSession({
      ...state,
      selectedAnswer: state.currentQuestion!.choices[0],
    });
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(old);
    expect(store.getActiveSession()!.selectedAnswer).toBeDefined();
    spy.mockRestore();
    expect(store.resetHistory()).toBe(true);
    store.saveSession(state);
    expect(createStorageService().getActiveSession()).toBeNull();
  });
});
