import { createContext } from 'react';

export const PracticeHistoryActionsContext = createContext<{
  resetHistory: () => boolean;
  clearAllData: () => boolean;
}>({
  resetHistory: () => false,
  clearAllData: () => false,
});
