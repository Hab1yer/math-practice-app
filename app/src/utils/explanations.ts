import type { Question } from '../types/question';

export function explainQuestion(question: Question): string {
  const { firstOperand: a, secondOperand: b, correctAnswer: answer } = question;
  switch (question.operation) {
    case 'addition':
      return `${a} plus ${b} makes ${answer}.`;
    case 'subtraction':
      return `Start with ${a} and take away ${b}. That leaves ${answer}.`;
    case 'multiplication':
      return a === 0 || b === 0
        ? 'Multiplying by zero gives zero.'
        : `${a} groups of ${b} make ${answer}.`;
    case 'division':
      return `${b} × ${answer} = ${a}, so ${a} ÷ ${b} = ${answer}.`;
  }
}

export function spokenProblem(question: Question): string {
  const words = {
    addition: 'plus',
    subtraction: 'minus',
    multiplication: 'multiplied by',
    division: 'divided by',
  };
  return `${question.firstOperand} ${words[question.operation]} ${question.secondOperand}`;
}
