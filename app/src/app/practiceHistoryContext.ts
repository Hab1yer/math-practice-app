import { createContext } from 'react';
import type { PracticeHistory } from '../services/storageValidation';

export const PracticeHistoryContext = createContext<PracticeHistory>({
  sessions: [],
  attempts: [],
});
