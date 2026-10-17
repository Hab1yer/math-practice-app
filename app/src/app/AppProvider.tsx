import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PracticeConfiguration } from '../types/session';
import { PracticeConfigurationContext } from './practiceConfigurationContext';
import { AppPreferencesContext } from './appPreferencesContext';
import type { CardPreferences } from './appPreferencesContext';
import PracticeSessionProvider from './PracticeSessionProvider';
import { createStorageService } from '../services/storageService';
import type { PracticeSessionState } from '../types/session';
import { PracticeHistoryContext } from './practiceHistoryContext';

export default function AppProvider({ children }: { children: ReactNode }) {
  const [configuration, setConfiguration] =
    useState<PracticeConfiguration | null>(null);
  const [storage] = useState(() => createStorageService());
  const [preferences, setPreferences] = useState(() => storage.getSettings());
  const [history, setHistory] = useState(storage.getHistory);
  const currentPreferences = useRef(preferences);
  const [storageWarning, setStorageWarning] = useState(storage.getWarning);
  function updatePreferences(updates: Partial<CardPreferences>) {
    const next = { ...currentPreferences.current, ...updates };
    currentPreferences.current = next;
    setPreferences(next);
    storage.saveSettings(next);
    setStorageWarning(storage.getWarning());
  }
  function persistSession(state: PracticeSessionState) {
    storage.saveSession(state);
    setHistory(storage.getHistory());
    setStorageWarning(storage.getWarning());
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
          <PracticeSessionProvider onPersist={persistSession}>
            {children}
          </PracticeSessionProvider>
        </PracticeHistoryContext.Provider>
      </AppPreferencesContext.Provider>
    </PracticeConfigurationContext.Provider>
  );
}
