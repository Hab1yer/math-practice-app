import type { DifficultyLevel, MathOperation } from '../types/question';
import type { SessionLength } from '../types/session';

export const operationOptions: {
  value: MathOperation;
  label: string;
  symbol: string;
}[] = [
  { value: 'addition', label: 'Addition', symbol: '+' },
  { value: 'subtraction', label: 'Subtraction', symbol: '−' },
  { value: 'multiplication', label: 'Multiplication', symbol: '×' },
  { value: 'division', label: 'Division', symbol: '÷' },
];

export const difficultyOptions: {
  value: DifficultyLevel;
  label: string;
  description: string;
}[] = [
  {
    value: 1,
    label: 'Beginner',
    description: 'Small numbers and your first number facts.',
  },
  {
    value: 2,
    label: 'Easy',
    description: 'A little more room to grow with familiar facts.',
  },
  {
    value: 3,
    label: 'Intermediate',
    description: 'Bigger numbers and a little extra thinking.',
  },
  {
    value: 4,
    label: 'Advanced',
    description: 'Try a challenge with numbers up to 1,000.',
  },
];

export const sessionLengthOptions: {
  value: SessionLength;
  label: string;
  description: string;
}[] = [
  { value: 5, label: '5 questions', description: 'A quick warm-up' },
  { value: 10, label: '10 questions', description: 'A little daily practice' },
  { value: 20, label: '20 questions', description: 'A longer adventure' },
  {
    value: 'continuous',
    label: 'Continuous',
    description: 'Choose when to stop',
  },
];
