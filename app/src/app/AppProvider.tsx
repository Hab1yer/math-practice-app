import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PracticeConfiguration } from '../types/session';
import { PracticeConfigurationContext } from './practiceConfigurationContext';
import { AppPreferencesContext } from './appPreferencesContext';
import type { AppSettings } from '../types/settings';
import { isValidSettings } from '../services/storageValidation';
import PracticeSessionProvider from './PracticeSessionProvider';
import { createStorageService } from '../services/storageService';
import type { PracticeSessionState } from '../types/session';
import { PracticeHistoryContext } from './practiceHistoryContext';
import { PracticeHistoryActionsContext } from './practiceHistoryActionsContext';

export default function AppProvider({ children }: { children: ReactNode }) {
  const [configuration, setConfiguration] =
    useState<PracticeConfiguration | null>(null);
  const [storage] = useState(() => createStorageService());
  const [preferences, setPreferences] = useState(() => storage.getSettings());
  const [history, setHistory] = useState(storage.getHistory);
  const [initialSession, setInitialSession] = useState(
    storage.getActiveSession,
  );
  const [sessionGeneration, setSessionGeneration] = useState(0);
  const currentPreferences = useRef(preferences);
  const [storageWarning, setStorageWarning] = useState(storage.getWarning);
  function updatePreferences(updates: Partial<AppSettings>) {
    const next = { ...currentPreferences.current, ...updates };
    if (!isValidSettings(next)) return;
    currentPreferences.current = next;
    setPreferences(next);
    storage.saveSettings(next);
    setHistory(storage.getHistory());
    setStorageWarning(storage.getWarning());
    if (
      'defaultOperations' in updates ||
      'defaultDifficulty' in updates ||
      'defaultSessionLength' in updates
    )
      setConfiguration(null);
  }
  function persistSession(state: PracticeSessionState) {
    storage.saveSession(state);
    const previous = history.sessions.find(
      (session) => session.id === state.session.id,
    );
    if (
      !previous ||
      previous.attempted !== state.session.attempted ||
      previous.completedAt !== state.session.completedAt
    )
      setHistory(storage.getHistory());
    setStorageWarning(storage.getWarning());
  }
  function resetHistory() {
    const reset = storage.resetHistory();
    setStorageWarning(storage.getWarning());
    if (reset) {
      setInitialSession(null);
      setHistory(storage.getHistory());
      setSessionGeneration((generation) => generation + 1);
    }
    return reset;
  }
  function clearAllData() {
    const cleared = storage.clearAllData();
    setStorageWarning(storage.getWarning());
    if (cleared) {
      setInitialSession(null);
      const defaults = storage.getSettings();
      currentPreferences.current = defaults;
      setPreferences(defaults);
      setHistory(storage.getHistory());
      setConfiguration(null);
      setSessionGeneration((generation) => generation + 1);
    }
    return cleared;
  }
  return (
    <PracticeConfigurationContext.Provider
      value={{ configuration, setConfiguration }}
    >
      <AppPreferencesContext.Provider
        value={{
          preferences,
          updatePreferences,
          storageWarning,
        }}
      >
        <PracticeHistoryContext.Provider value={history}>
          <PracticeHistoryActionsContext.Provider
            value={{ resetHistory, clearAllData }}
          >
            <PracticeSessionProvider
              key={sessionGeneration}
              onPersist={persistSession}
              initialState={initialSession}
              getReviewOptions={() => ({
                patterns: storage.getMistakePatterns(),
                masteryThreshold: storage.getSettings().masteryThreshold,
              })}
            >
              {children}
            </PracticeSessionProvider>
          </PracticeHistoryActionsContext.Provider>
        </PracticeHistoryContext.Provider>
      </AppPreferencesContext.Provider>
    </PracticeConfigurationContext.Provider>
  );
}
