import { createContext } from 'react';
import type { AppSettings } from '../types/settings';

export const AppPreferencesContext = createContext<{
  preferences: AppSettings;
  updatePreferences: (updates: Partial<AppSettings>) => void;
  storageWarning?: string | null;
} | null>(null);
