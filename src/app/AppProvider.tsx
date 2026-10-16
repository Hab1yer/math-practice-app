import { useState } from 'react';
import type { ReactNode } from 'react';
import type { PracticeConfiguration } from '../types/session';
import { PracticeConfigurationContext } from './practiceConfigurationContext';
import { AppPreferencesContext } from './appPreferencesContext';
import type { CardPreferences } from './appPreferencesContext';

export default function AppProvider({ children }: { children: ReactNode }) {
  const [configuration, setConfiguration] =
    useState<PracticeConfiguration | null>(null);
  const [preferences, setPreferences] = useState<CardPreferences>({
    cardAnimationEnabled: true,
    showExplanations: true,
  });
  return (
    <PracticeConfigurationContext.Provider
      value={{ configuration, setConfiguration }}
    >
      <AppPreferencesContext.Provider
        value={{
          preferences,
          updatePreferences: (updates) =>
            setPreferences((current) => ({ ...current, ...updates })),
        }}
      >
        {children}
      </AppPreferencesContext.Provider>
    </PracticeConfigurationContext.Provider>
  );
}
