import { createContext } from 'react';
import type { AppSettings } from '../types/settings';

export type CardPreferences = Pick<
  AppSettings,
  'cardAnimationEnabled' | 'showExplanations'
>;
export const AppPreferencesContext = createContext<{
  preferences: CardPreferences;
  updatePreferences: (updates: Partial<CardPreferences>) => void;
  storageWarning?: string | null;
} | null>(null);
