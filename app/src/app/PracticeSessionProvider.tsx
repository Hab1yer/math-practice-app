import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PracticeSessionState } from '../types/session';
import {
  startPracticeSession,
  recordPracticeResult,
  endPracticeSession,
} from '../services/practiceSession';
import { PracticeSessionContext } from './practiceSessionContext';

export default function PracticeSessionProvider({
  children,
  onPersist,
}: {
  children: ReactNode;
  onPersist?: (state: PracticeSessionState) => void;
}) {
  const [state, setState] = useState<PracticeSessionState | null>(null);
  const current = useRef<PracticeSessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  function commit(next: PracticeSessionState) {
    if (next === current.current) return;
    current.current = next;
    setState(next);
    setError(null);
    onPersist?.(next);
  }
  return (
    <PracticeSessionContext.Provider
      value={{
        state,
        error,
        startSession: (configuration) => {
          try {
            commit(startPracticeSession(configuration));
            return true;
          } catch {
            setError(
              'We couldn’t start that practice. Please check your choices and try again.',
            );
            return false;
          }
        },
        recordResult: (submission) => {
          if (!current.current) return;
          try {
            commit(recordPracticeResult(current.current, submission));
          } catch {
            setError(
              'We couldn’t prepare the next question. You can end this session and try again.',
            );
          }
        },
        endSession: () => {
          if (current.current) commit(endPracticeSession(current.current));
        },
      }}
    >
      {children}
    </PracticeSessionContext.Provider>
  );
}
