import type {
  DifficultyLevel,
  MathOperation,
  QuestionSource,
} from './question';

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
  attemptedAt: string;
  sessionId: string;
}

export interface PracticeSession {
  id: string;
  startedAt: string;
  completedAt?: string;
  operations: MathOperation[];
  difficulty: DifficultyLevel;
  sessionLength: SessionLength;
  attempted: number;
  correct: number;
  incorrect: number;
}
