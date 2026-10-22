import type {
  DifficultyLevel,
  MathOperation,
  QuestionSource,
  Question,
} from './question';
import type { MistakePattern } from './mistake';

export type SessionLength = 5 | 10 | 20 | 'continuous';

export interface PracticeConfiguration {
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  mode: QuestionSource;
}

export interface PracticeAttempt {
  id: string;
  questionId: string;
  operation: MathOperation;
  firstOperand: number;
  secondOperand: number;
  correctAnswer: number;
  selectedAnswer: number;
  /** Scoring uses the child's self-reported result, not answer equality. */
  selfReportedCorrect: boolean;
  difficulty: DifficultyLevel;
  source: QuestionSource;
  mistakePatternId?: string;
  attemptedAt: string;
  sessionId: string;
}

export interface PracticeSession {
  id: string;
  /** Absent on older regular sessions. */
  mode?: QuestionSource;
  completionReason?: 'mastered';
  startedAt: string;
  completedAt?: string;
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  attempted: number;
  correct: number;
  incorrect: number;
}

export interface PracticeSessionState {
  session: PracticeSession;
  currentQuestion: Question | null;
  currentQuestionIndex: number;
  attempts: PracticeAttempt[];
  isActive: boolean;
  reviewPatterns?: MistakePattern[];
  reviewMasteryThreshold?: number;
  selectedAnswer?: number;
  isCardFlipped?: boolean;
  feedback?: string;
}
