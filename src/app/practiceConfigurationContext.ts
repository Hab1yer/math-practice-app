import { createContext } from 'react';
import type { PracticeConfiguration } from '../types/session';

export const PracticeConfigurationContext = createContext<{
  configuration: PracticeConfiguration | null;
  setConfiguration: (configuration: PracticeConfiguration) => void;
} | null>(null);
