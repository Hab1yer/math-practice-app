import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createStorageService,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
} from './storageService';
import {
  startPracticeSession,
  recordPracticeResult,
  endPracticeSession,
} from './practiceSession';
import { isValidHistory, isValidSettings } from './storageValidation';

afterEach(() => vi.restoreAllMocks());
const start = () =>
  startPracticeSession({
    operations: ['addition', 'division'],
    difficulty: 2,
    sessionLength: 5,
    mode: 'regular',
  });
function answer(state = start()) {
  return recordPracticeResult(state, {
    questionId: state.currentQuestion!.id,
    selectedAnswer: state.currentQuestion!.choices[0],
    selfReportedCorrect: false,
  });
}
const put = (key: string, data: unknown, version = 1) =>
  localStorage.setItem(key, JSON.stringify({ version, data }));

describe('versioned browser storage', () => {
  it('uses defaults without writing or touching unrelated browser data', () => {
    localStorage.setItem('other-app', 'keep');
    const store = createStorageService();
    expect(store.getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(store.getHistory()).toEqual({ sessions: [], attempts: [] });
    expect(store.getWarning()).toBeNull();
    expect(localStorage.length).toBe(1);
    const settings = store.getSettings();
    settings.defaultOperations.push('division');
    expect(store.getSettings().defaultOperations).toEqual(['addition']);
  });
  it('roundtrips all settings and saves version 1', () => {
    const settings = {
      ...DEFAULT_SETTINGS,
      cardAnimationEnabled: false,
      showExplanations: false,
      defaultDifficulty: 4 as const,
      defaultOperations: ['division' as const],
    };
    createStorageService().saveSettings(settings);
    expect(createStorageService().getSettings()).toEqual(settings);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)!).version,
    ).toBe(1);
  });
  it.each(['raw', 'envelope', 'version-zero'])(
    'loads %s legacy settings and upgrades on the next write',
    (shape) => {
      const data = { ...DEFAULT_SETTINGS, showExplanations: false };
      localStorage.setItem(
        STORAGE_KEYS.settings,
        JSON.stringify(
          shape === 'raw'
            ? data
            : shape === 'envelope'
              ? { data }
              : { version: 0, data },
        ),
      );
      const store = createStorageService();
      expect(store.getSettings()).toEqual(data);
      store.saveSettings(data);
      expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)!)).toEqual({
        version: 1,
        data,
      });
    },
  );
  it('saves complete attempts immediately and preserves completion and prior sessions', () => {
    const store = createStorageService();
    const active = answer();
    store.saveSession(active);
    expect(createStorageService().getHistory().attempts).toEqual(
      active.attempts,
    );
    const ended = endPracticeSession(active);
    store.saveSession(ended);
    store.saveSession(ended);
    store.saveSession(start());
    const reloaded = createStorageService();
    expect(reloaded.getHistory().sessions).toHaveLength(2);
    expect(
      reloaded
        .getHistory()
        .sessions.find((session) => session.id === ended.session.id),
    ).toEqual(ended.session);
    expect(reloaded.getHistory().attempts).toEqual(ended.attempts);
    expect(isValidHistory(reloaded.getHistory())).toBe(true);
    const copy = reloaded.getHistory();
    copy.attempts.length = 0;
    expect(reloaded.getHistory().attempts).toHaveLength(1);
  });
  it.each([STORAGE_KEYS.settings, STORAGE_KEYS.history])(
    'preserves unsupported future data in %s',
    (key) => {
      put(key, { unknown: true }, 99);
      const original = localStorage.getItem(key);
      const store = createStorageService();
      store.saveSettings({ ...DEFAULT_SETTINGS, showExplanations: false });
      store.saveSession(answer());
      expect(localStorage.getItem(key)).toBe(original);
      expect(store.getWarning()).toMatch(/newer app/);
    },
  );
  it('protects a future schema written after this tab loaded', () => {
    const store = createStorageService();
    put(STORAGE_KEYS.settings, { unknown: true }, 99);
    store.saveSettings(DEFAULT_SETTINGS);
    expect(
      JSON.parse(localStorage.getItem(STORAGE_KEYS.settings)!).version,
    ).toBe(99);
    expect(store.getWarning()).toMatch(/newer app/);
  });
  it('recovers malformed settings independently of valid history and unrelated keys', () => {
    const state = endPracticeSession(answer());
    createStorageService().saveSession(state);
    const original = localStorage.getItem(STORAGE_KEYS.history);
    localStorage.setItem('other-app', 'keep');
    localStorage.setItem(STORAGE_KEYS.settings, '{broken');
    const store = createStorageService();
    expect(store.getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(store.getHistory().attempts).toHaveLength(1);
    expect(store.getWarning()).toMatch(/settings could not be read/);
    store.saveSettings(DEFAULT_SETTINGS);
    expect(store.getWarning()).toBeNull();
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(original);
    expect(localStorage.getItem('other-app')).toBe('keep');
  });
  it('defaults invalid history while keeping valid settings and recovers on new practice', () => {
    createStorageService().saveSettings({
      ...DEFAULT_SETTINGS,
      showExplanations: false,
    });
    put(STORAGE_KEYS.history, { sessions: [{}], attempts: [] });
    const store = createStorageService();
    expect(store.getWarning()).toMatch(/history could not be read/);
    expect(store.getSettings().showExplanations).toBe(false);
    store.saveSession(answer());
    expect(store.getWarning()).toBeNull();
    expect(createStorageService().getHistory().attempts).toHaveLength(1);
  });
  it.each(['access', 'read', 'write'])(
    'keeps functioning when storage %s is blocked',
    (failure) => {
      const access = () => {
        if (failure === 'access')
          throw new DOMException('Blocked', 'SecurityError');
        return {
          getItem: () => {
            if (failure === 'read')
              throw new DOMException('Blocked', 'SecurityError');
            return null;
          },
          setItem: () => {
            throw new DOMException('Blocked', 'SecurityError');
          },
        };
      };
      const store = createStorageService(access);
      store.saveSession(answer());
      store.saveSettings({ ...DEFAULT_SETTINGS, cardAnimationEnabled: false });
      expect(store.getHistory().attempts).toHaveLength(1);
      expect(store.getSettings().cardAnimationEnabled).toBe(false);
      expect(store.getWarning()).toMatch(/Saving is unavailable/);
    },
  );
  it('preserves previous disk data and in-memory attempts on quota failure and retries later', () => {
    const store = createStorageService();
    const first = answer();
    store.saveSession(first);
    const original = localStorage.getItem(STORAGE_KEYS.history);
    const spy = vi
      .spyOn(Storage.prototype, 'setItem')
      .mockImplementation(() => {
        throw new DOMException('Full', 'QuotaExceededError');
      });
    const second = answer(first);
    store.saveSession(second);
    expect(store.getWarning()).toMatch(/out of saving space/);
    expect(store.getHistory().attempts).toHaveLength(2);
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(original);
    spy.mockRestore();
    store.saveSession(endPracticeSession(second));
    expect(store.getWarning()).toBeNull();
    expect(createStorageService().getHistory().attempts).toHaveLength(2);
  });
  it('merges sequential writes from different tabs without regressing newer session totals', () => {
    const first = createStorageService();
    const second = createStorageService();
    const one = answer();
    first.saveSession(one);
    const two = answer(one);
    second.saveSession(two);
    first.saveSession(answer());
    first.saveSession(one);
    const history = createStorageService().getHistory();
    expect(history.sessions).toHaveLength(2);
    expect(history.attempts).toHaveLength(3);
    expect(
      history.sessions.find((session) => session.id === one.session.id)
        ?.attempted,
    ).toBe(2);
  });
  it('bounds recent-session retrieval without deleting full history or attempts', () => {
    const store = createStorageService();
    for (let index = 0; index < 105; index++) {
      const state = start();
      state.session.startedAt = new Date(
        Date.UTC(2026, 0, index + 1),
      ).toISOString();
      store.saveSession(state);
    }
    expect(store.getRecentSessions()).toHaveLength(50);
    expect(store.getRecentSessions(1000)).toHaveLength(100);
    expect(store.getRecentSessions(-1)).toEqual([]);
    expect(store.getRecentSessions(NaN)).toHaveLength(50);
    expect(store.getRecentSessions(1)[0].startedAt).toBe(
      new Date(Date.UTC(2026, 0, 105)).toISOString(),
    );
    expect(createStorageService().getHistory().sessions).toHaveLength(105);
  });
});

describe('stored record validation', () => {
  it.each([
    { ...DEFAULT_SETTINGS, cardAnimationEnabled: 'true' },
    { ...DEFAULT_SETTINGS, defaultOperations: new Array(1) },
    { ...DEFAULT_SETTINGS, defaultDifficulty: 9 },
    { ...DEFAULT_SETTINGS, defaultSessionLength: '5' },
    { ...DEFAULT_SETTINGS, masteryThreshold: 0 },
  ])('rejects malformed settings %#', (data) =>
    expect(isValidSettings(data)).toBe(false),
  );
  it.each([
    'counts',
    'date',
    'operation',
    'answer',
    'selected',
    'report',
    'session',
    'duplicate',
    'sparse',
  ])('rejects corrupted history: %s', (problem) => {
    const state = endPracticeSession(answer());
    const data = { sessions: [state.session], attempts: state.attempts };
    if (problem === 'counts') data.sessions[0].attempted++;
    if (problem === 'date') data.attempts[0].attemptedAt = 'yesterday';
    if (problem === 'operation')
      data.attempts[0].operation = 'constructor' as never;
    if (problem === 'answer') data.attempts[0].correctAnswer++;
    if (problem === 'selected') data.attempts[0].selectedAnswer = NaN;
    if (problem === 'report')
      data.attempts[0].selfReportedCorrect = 'false' as never;
    if (problem === 'session') data.attempts[0].sessionId = 'missing';
    if (problem === 'duplicate') data.attempts.push({ ...data.attempts[0] });
    if (problem === 'sparse') data.sessions = new Array(1);
    expect(isValidHistory(data)).toBe(false);
  });
});
