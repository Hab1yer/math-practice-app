import { useContext } from 'react';
import { PracticeSessionContext } from '../app/practiceSessionContext';

export function usePracticeSession() {
  const context = useContext(PracticeSessionContext);
  if (!context) throw new Error('Practice sessions require AppProvider');
  return context;
}
