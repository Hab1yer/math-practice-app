import { useContext } from 'react';
import { PracticeConfigurationContext } from '../app/practiceConfigurationContext';

export function usePracticeConfiguration() {
  const context = useContext(PracticeConfigurationContext);
  if (!context) throw new Error('Practice configuration requires AppProvider');
  return context;
}
