import type { PracticeConfiguration } from '../types/session';
import { isDifficultyLevel, isMathOperation } from './difficultyRules';

export function isValidConfiguration(
  value: unknown,
): value is PracticeConfiguration {
  if (!value || typeof value !== 'object') return false;
  const config = value as Record<string, unknown>;
  return (
    Array.isArray(config.operations) &&
    config.operations.length > 0 &&
    [...config.operations].every(isMathOperation) &&
    isDifficultyLevel(config.difficulty) &&
    [5, 10, 20, 'continuous'].includes(
      config.sessionLength as number | string,
    ) &&
    (config.mode === 'regular' || config.mode === 'mistake-review')
  );
}
