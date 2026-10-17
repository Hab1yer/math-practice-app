import type { DifficultyLevel, MathOperation } from './question';

export interface OperationStatistics {
  attempted: number;
  correct: number;
  incorrect: number;
}

export interface AppStatistics extends OperationStatistics {
  byOperation: Record<MathOperation, OperationStatistics>;
  byDifficulty: Record<DifficultyLevel, OperationStatistics>;
}
