import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { PracticeSessionState } from '../types/session';
import {
  startPracticeSession,
  recordPracticeResult,
  endPracticeSession,
} from '../services/practiceSession';
import { PracticeSessionContext } from './practiceSessionContext';
import type { ReviewOptions } from '../services/mistakeReview';

export default function PracticeSessionProvider({
  children,
  onPersist,
  getReviewOptions,
  initialState = null,
}: {
  children: ReactNode;
  onPersist?: (state: PracticeSessionState) => void;
  getReviewOptions?: () => ReviewOptions;
  initialState?: PracticeSessionState | null;
}) {
  const [state, setState] = useState<PracticeSessionState | null>(initialState);
  const current = useRef<PracticeSessionState | null>(initialState);
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
        isSessionActive: () => current.current?.isActive ?? false,
        startSession: (configuration) => {
          try {
            commit(startPracticeSession(configuration, getReviewOptions?.()));
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
            const next = recordPracticeResult(
              current.current,
              submission,
              getReviewOptions?.(),
            );
            commit(next);
            return next;
          } catch {
            setError(
              'We couldn’t prepare the next question. You can end this session and try again.',
            );
          }
        },
        endSession: () => {
          if (current.current) commit(endPracticeSession(current.current));
        },
        updateCard: (questionId, selectedAnswer, flipped) => {
          const previous = current.current;
          if (
            !previous?.isActive ||
            previous.currentQuestion?.id !== questionId ||
            !previous.currentQuestion.choices.includes(selectedAnswer) ||
            previous.isCardFlipped
          )
            return;
          commit({ ...previous, selectedAnswer, isCardFlipped: flipped });
        },
      }}
    >
      {children}
    </PracticeSessionContext.Provider>
  );
}
