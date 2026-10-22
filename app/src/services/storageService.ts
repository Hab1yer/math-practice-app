import type { AppSettings } from '../types/settings';
import type { PracticeSessionState } from '../types/session';
import { isRecord, isValidHistory, isValidSettings } from './storageValidation';
import type { PracticeHistory } from './storageValidation';
import {
  clearApplicationStorage,
  recoverInterruptedClear,
} from './storageClear';
import type { BrowserStorage } from './storageClear';
import { isValidMistakePattern, trackMistakes } from './mistakeTracking';

export const STORAGE_VERSION = 1;
export const STORAGE_KEYS = {
  settings: 'mathPractice.settings',
  history: 'mathPractice.history',
} as const;
export const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: false,
  cardAnimationEnabled: true,
  showExplanations: true,
  feedbackEffectsEnabled: true,
  defaultSessionLength: 10,
  defaultDifficulty: 1,
  defaultOperations: ['addition'],
  masteryThreshold: 3,
};
type StorageAccess = () => BrowserStorage;
type Category = keyof typeof STORAGE_KEYS;
interface Loaded<T> {
  data: T;
  warning: string | null;
  readOnly: boolean;
}
const copy = <T>(value: T): T => structuredClone(value);

export function createStorageService(
  access: StorageAccess = () => window.localStorage,
) {
  let recoveryBlocked = false;
  try {
    recoverInterruptedClear(access());
  } catch {
    // Normal denied-storage reads still get their usual warning; a pending journal blocks all writes.
    try {
      recoveryBlocked =
        access().getItem('mathPractice.clearTransaction') !== null;
    } catch {
      /* read() reports denied access */
    }
  }
  function read<T>(
    category: Category,
    fallback: T,
    validate: (value: unknown) => value is T,
  ): Loaded<T> {
    if (recoveryBlocked)
      return {
        data: copy(fallback),
        readOnly: true,
        warning:
          'An interrupted data clear could not be recovered. Reload when browser storage is available.',
      };
    try {
      const raw = access().getItem(STORAGE_KEYS[category]);
      if (raw === null)
        return { data: copy(fallback), warning: null, readOnly: false };
      const parsed: unknown = JSON.parse(raw);
      const version = isRecord(parsed) ? parsed.version : undefined;
      if (typeof version === 'number' && version > STORAGE_VERSION) {
        return {
          data: copy(fallback),
          readOnly: true,
          warning: `Saved ${category} came from a newer app. New ${category} cannot be saved here yet.`,
        };
      }
      // Version 0 is the initial unversioned shape. Future migrations belong here.
      if (version !== undefined && version !== 0 && version !== STORAGE_VERSION)
        throw new Error('Invalid version');
      const data = isRecord(parsed) && 'data' in parsed ? parsed.data : parsed;
      if (!validate(data)) throw new Error('Invalid saved data');
      return { data: copy(data), warning: null, readOnly: false };
    } catch (error) {
      return {
        data: copy(fallback),
        readOnly: false,
        warning:
          error instanceof SyntaxError ||
          (error instanceof Error && error.message.startsWith('Invalid'))
            ? `Some saved ${category} could not be read. New practice still works.`
            : 'Saving is unavailable in this browser. You can keep practicing, but new progress may not be saved.',
      };
    }
  }
  let settings = read('settings', DEFAULT_SETTINGS, isValidSettings);
  function readHistory(): Loaded<PracticeHistory> {
    const loaded = read<PracticeHistory>(
      'history',
      { sessions: [], attempts: [] },
      isValidHistory,
    );
    const raw: unknown = loaded.data.mistakePatterns;
    const valid = Array.isArray(raw) ? raw.filter(isValidMistakePattern) : [];
    const patterns = trackMistakes(loaded.data.attempts, valid);
    const byId = new Map(patterns.map((pattern) => [pattern.id, pattern]));
    const damaged =
      raw !== undefined &&
      (!Array.isArray(raw) ||
        valid.length !== raw.length ||
        valid.length !== patterns.length ||
        valid.some((pattern) => {
          const rebuilt = byId.get(pattern.id);
          return (
            !rebuilt ||
            rebuilt.incorrectCount !== pattern.incorrectCount ||
            rebuilt.lastIncorrectAt !== pattern.lastIncorrectAt
          );
        }) ||
        new Set(valid.map((pattern) => pattern.id)).size !== valid.length);
    return {
      ...loaded,
      data:
        raw !== undefined || patterns.length
          ? { ...loaded.data, mistakePatterns: patterns }
          : loaded.data,
      warning:
        loaded.warning ??
        (damaged
          ? 'Some saved mistake patterns were rebuilt from your practice history.'
          : null),
    };
  }
  let history = readHistory();
  const discardedSessions = new Set<string>();
  function write<T>(category: Category, loaded: Loaded<T>): Loaded<T> {
    if (loaded.readOnly) return loaded;
    try {
      access().setItem(
        STORAGE_KEYS[category],
        JSON.stringify({ version: STORAGE_VERSION, data: loaded.data }),
      );
      return { ...loaded, warning: null };
    } catch (error) {
      const full = isRecord(error) && error.name === 'QuotaExceededError';
      return {
        ...loaded,
        warning: full
          ? 'This browser is out of saving space. You can keep practicing, but new progress may not be saved.'
          : 'Saving is unavailable in this browser. You can keep practicing, but new progress may not be saved.',
      };
    }
  }
  return {
    getSettings: () => copy(settings.data),
    getHistory: () => copy(history.data),
    getMistakePatterns: () => copy(history.data.mistakePatterns ?? []),
    getWarning: () =>
      [...new Set([settings.warning, history.warning].filter(Boolean))].join(
        ' ',
      ) || null,
    saveSettings(value: AppSettings) {
      if (!isValidSettings(value)) return;
      const disk = read('settings', DEFAULT_SETTINGS, isValidSettings);
      if (disk.readOnly) {
        settings = {
          ...settings,
          data: copy(value),
          readOnly: true,
          warning: disk.warning,
        };
        return;
      }
      settings = write('settings', { ...settings, data: copy(value) });
    },
    saveSession(state: PracticeSessionState) {
      // Merge the latest disk snapshot so sequential writes from another tab are retained.
      const disk = readHistory();
      if (disk.readOnly) {
        history = { ...history, readOnly: true, warning: disk.warning };
        return;
      }
      if (disk.data.resetAt && disk.data.resetAt !== history.data.resetAt) {
        for (const session of history.data.sessions)
          discardedSessions.add(session.id);
        history = disk;
      }
      if (
        discardedSessions.has(state.session.id) ||
        (history.data.resetAt && state.session.startedAt < history.data.resetAt)
      ) {
        history = {
          ...history,
          warning:
            'Practice history was reset. Start a new session to save new answers.',
        };
        return;
      }
      const sessions = new Map(
        disk.data.sessions.map((session) => [session.id, session]),
      );
      for (const session of history.data.sessions) {
        const saved = sessions.get(session.id);
        if (
          !saved ||
          session.attempted > saved.attempted ||
          (session.attempted === saved.attempted &&
            session.completedAt &&
            !saved.completedAt)
        )
          sessions.set(session.id, session);
      }
      const attempts = new Map(
        [...disk.data.attempts, ...history.data.attempts].map((attempt) => [
          attempt.id,
          attempt,
        ]),
      );
      const saved = sessions.get(state.session.id);
      if (
        !saved ||
        state.session.attempted > saved.attempted ||
        (state.session.attempted === saved.attempted && !saved.completedAt)
      )
        sessions.set(state.session.id, copy(state.session));
      for (const attempt of state.attempts)
        attempts.set(attempt.id, copy(attempt));
      const data = {
        ...(history.data.resetAt ? { resetAt: history.data.resetAt } : {}),
        sessions: [...sessions.values()],
        attempts: [...attempts.values()],
      };
      if (!isValidHistory(data)) {
        history = {
          ...history,
          warning: 'These results could not be saved. You can keep practicing.',
        };
        return;
      }
      // One envelope commits answers and their patterns together, including quota retries.
      const previous =
        disk.data.mistakePatterns ?? history.data.mistakePatterns ?? [];
      Object.assign(data, {
        mistakePatterns: trackMistakes(data.attempts, previous),
      });
      history = write('history', { ...history, data });
    },
    resetHistory() {
      const disk = readHistory();
      if (disk.readOnly || history.readOnly) {
        history = { ...history, warning: disk.warning ?? history.warning };
        return false;
      }
      const cleared = write<PracticeHistory>('history', {
        data: { sessions: [], attempts: [], resetAt: new Date().toISOString() },
        warning: null,
        readOnly: false,
      });
      if (cleared.warning) {
        history = { ...history, warning: cleared.warning };
        return false;
      }
      for (const session of [...history.data.sessions, ...disk.data.sessions])
        discardedSessions.add(session.id);
      history = cleared;
      return true;
    },
    clearAllData() {
      if (recoveryBlocked) return false;
      try {
        const resetAt = new Date().toISOString();
        if (!clearApplicationStorage(access(), resetAt, STORAGE_VERSION))
          throw new Error('Clear failed');
        for (const session of history.data.sessions)
          discardedSessions.add(session.id);
        settings = {
          data: copy(DEFAULT_SETTINGS),
          warning: null,
          readOnly: false,
        };
        history = {
          data: { sessions: [], attempts: [], resetAt },
          warning: null,
          readOnly: false,
        };
        return true;
      } catch {
        history = {
          ...history,
          warning:
            'Application data could not be fully cleared. Reload before trying again.',
        };
        // If rollback was blocked, prevent later actions from overwriting its recovery journal.
        try {
          recoveryBlocked =
            access().getItem('mathPractice.clearTransaction') !== null;
        } catch {
          recoveryBlocked = true;
        }
        return false;
      }
    },
    getRecentSessions(limit = 50) {
      const count = Number.isSafeInteger(limit)
        ? Math.max(0, Math.min(limit, 100))
        : 50;
      return copy(history.data.sessions)
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, count);
    },
  };
}
