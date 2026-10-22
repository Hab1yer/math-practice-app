import { createContext } from 'react';

export const PracticeHistoryActionsContext = createContext<{
  resetHistory: () => boolean;
}>({
  resetHistory: () => false,
});
