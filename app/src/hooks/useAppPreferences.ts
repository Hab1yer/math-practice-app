import { useContext } from 'react';
import { AppPreferencesContext } from '../app/appPreferencesContext';

export function useAppPreferences() {
  const context = useContext(AppPreferencesContext);
  if (!context) throw new Error('Card preferences require AppProvider');
  return context;
}
