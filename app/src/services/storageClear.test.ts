import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createStorageService,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
} from './storageService';
import { APPLICATION_DATA_KEYS, CLEAR_JOURNAL_KEY } from './storageClear';
import { startPracticeSession, recordPracticeResult } from './practiceSession';

afterEach(() => vi.restoreAllMocks());
function seed() {
  const store = createStorageService();
  store.saveSettings({
    ...DEFAULT_SETTINGS,
    soundEnabled: true,
    defaultDifficulty: 4,
  });
  let state = startPracticeSession({
    operations: ['addition'],
    difficulty: 1,
    sessionLength: 5,
    mode: 'regular',
  });
  state = recordPracticeResult(state, {
    questionId: state.currentQuestion!.id,
    selectedAnswer: state.currentQuestion!.choices[0],
    selfReportedCorrect: false,
  });
  store.saveSession(state);
  for (const key of APPLICATION_DATA_KEYS)
    if (localStorage.getItem(key) === null)
      localStorage.setItem(key, '{"legacy":true}');
  localStorage.setItem('unrelated-app', 'keep');
  return { store, state };
}
describe('clear all application data', () => {
  it('clears known data and legacy keys, restores defaults, leaves unrelated keys and prevents stale saves', () => {
    const { store, state } = seed();
    expect(store.clearAllData()).toBe(true);
    expect(store.getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(createStorageService().getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(createStorageService().getHistory()).toMatchObject({
      sessions: [],
      attempts: [],
    });
    for (const key of APPLICATION_DATA_KEYS)
      if (key !== STORAGE_KEYS.history)
        expect(localStorage.getItem(key)).toBeNull();
    expect(localStorage.getItem(CLEAR_JOURNAL_KEY)).toBeNull();
    expect(localStorage.getItem('unrelated-app')).toBe('keep');
    store.saveSession(state);
    expect(createStorageService().getHistory().attempts).toEqual([]);
  });
  it('changes nothing when the recovery journal cannot be saved', () => {
    const { store } = seed();
    const before = localStorage.getItem(STORAGE_KEYS.history);
    const settings = localStorage.getItem(STORAGE_KEYS.settings);
    const original = Storage.prototype.setItem;
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (key === CLEAR_JOURNAL_KEY)
        throw new DOMException('Full', 'QuotaExceededError');
      original.call(this, key, value);
    });
    expect(store.clearAllData()).toBe(false);
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(before);
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBe(settings);
    expect(store.getHistory().attempts).toHaveLength(1);
  });
  it('rolls back a failure after deletion starts', () => {
    const { store } = seed();
    const before = APPLICATION_DATA_KEYS.map((key) => [
      key,
      localStorage.getItem(key),
    ]);
    const original = Storage.prototype.removeItem;
    let failed = false;
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
      this: Storage,
      key,
    ) {
      if (key === STORAGE_KEYS.history && !failed) {
        failed = true;
        throw new DOMException('Blocked', 'SecurityError');
      }
      original.call(this, key);
    });
    expect(store.clearAllData()).toBe(false);
    expect(
      APPLICATION_DATA_KEYS.map((key) => [key, localStorage.getItem(key)]),
    ).toEqual(before);
    expect(localStorage.getItem(CLEAR_JOURNAL_KEY)).toBeNull();
  });
  it('recovers an interrupted clear before loading the app', () => {
    seed();
    const backup = APPLICATION_DATA_KEYS.map((key) => [
      key,
      localStorage.getItem(key),
    ]);
    localStorage.setItem(CLEAR_JOURNAL_KEY, JSON.stringify(backup));
    localStorage.removeItem(STORAGE_KEYS.settings);
    localStorage.removeItem(STORAGE_KEYS.history);
    const recovered = createStorageService();
    expect(recovered.getSettings().soundEnabled).toBe(true);
    expect(recovered.getHistory().attempts).toHaveLength(1);
    expect(recovered.getWarning()).toBeNull();
    expect(localStorage.getItem(CLEAR_JOURNAL_KEY)).toBeNull();
  });
  it('retains a failed rollback journal and blocks writes until a later startup can recover', () => {
    const { store, state } = seed();
    const remove = Storage.prototype.removeItem;
    const set = Storage.prototype.setItem;
    let rollback = false;
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
      this: Storage,
      key,
    ) {
      if (key === STORAGE_KEYS.history) {
        rollback = true;
        throw new DOMException('Blocked', 'SecurityError');
      }
      remove.call(this, key);
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (
      this: Storage,
      key,
      value,
    ) {
      if (rollback && key === STORAGE_KEYS.settings)
        throw new DOMException('Blocked', 'SecurityError');
      set.call(this, key, value);
    });
    expect(store.clearAllData()).toBe(false);
    expect(localStorage.getItem(CLEAR_JOURNAL_KEY)).not.toBeNull();
    store.saveSession(state);
    expect(localStorage.getItem(CLEAR_JOURNAL_KEY)).not.toBeNull();
    const blocked = createStorageService();
    expect(blocked.getWarning()).toMatch(/interrupted data clear/);
    expect(blocked.resetHistory()).toBe(false);
    vi.restoreAllMocks();
    const recovered = createStorageService();
    expect(recovered.getSettings().soundEnabled).toBe(true);
    expect(recovered.getHistory().attempts).toHaveLength(1);
  });
  it('does not execute a malformed journal against arbitrary browser keys', () => {
    localStorage.setItem('unrelated-app', 'keep');
    localStorage.setItem(
      CLEAR_JOURNAL_KEY,
      JSON.stringify([['unrelated-app', null]]),
    );
    const store = createStorageService();
    store.saveSettings(DEFAULT_SETTINGS);
    expect(store.getWarning()).toMatch(/interrupted data clear/);
    expect(localStorage.getItem('unrelated-app')).toBe('keep');
    expect(store.clearAllData()).toBe(false);
  });
  it('allows explicitly clearing app data from an unsupported newer schema', () => {
    localStorage.setItem(
      STORAGE_KEYS.settings,
      '{"version":99,"data":{"unknown":true}}',
    );
    const store = createStorageService();
    expect(store.clearAllData()).toBe(true);
    expect(createStorageService().getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBeNull();
  });
});
