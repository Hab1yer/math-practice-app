import { createContext } from 'react';
import type {
  PracticeConfiguration,
  PracticeSessionState,
} from '../types/session';
import type { CardSubmission } from '../services/practiceSession';

export const PracticeSessionContext = createContext<{
  state: PracticeSessionState | null;
  error: string | null;
  startSession: (configuration: PracticeConfiguration) => boolean;
  recordResult: (submission: CardSubmission) => PracticeSessionState | void;
  endSession: () => void;
  isSessionActive?: () => boolean;
  updateCard?: (
    questionId: string,
    selectedAnswer: number,
    flipped: boolean,
  ) => void;
} | null>(null);
