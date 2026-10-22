import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import QuestionCard from './QuestionCard';
import type { Question } from '../../types/question';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
const question: Question = {
  id: 'keyboard',
  operation: 'addition',
  difficulty: 1,
  firstOperand: 3,
  secondOperand: 4,
  correctAnswer: 7,
  choices: [6, 7, 8, 9],
  displayText: '3 + 4 = ?',
  source: 'regular',
};
const props = {
  question,
  questionNumber: 2,
  totalQuestions: 5 as const,
  onResult: vi.fn(),
};
describe('accessible card interactions', () => {
  it('supports 1–4, protects modified keys and form fields, and locks shortcuts after reveal', async () => {
    const user = userEvent.setup();
    render(
      <>
        <input aria-label="Unrelated field" />
        <QuestionCard {...props} />
      </>,
    );
    await user.keyboard('2');
    expect(screen.getByRole('button', { name: 'Answer 2: 7' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(
      screen.getByRole('status', { name: 'Answer selection' }),
    ).toHaveTextContent('Selected answer: 7');
    fireEvent.keyDown(screen.getByRole('region'), { key: '3', ctrlKey: true });
    await user.click(screen.getByRole('textbox', { name: 'Unrelated field' }));
    await user.keyboard('4');
    expect(screen.getByRole('button', { name: 'Answer 2: 7' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.keyboard('1');
    expect(screen.getByText('Your answer:')).toHaveTextContent('7');
    expect(
      screen.getByRole('heading', { name: '3 plus 4 equals 7' }),
    ).toHaveFocus();
  });
  it('uses native Enter and Space, exposes selected state and focuses each new problem', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<QuestionCard {...props} />);
    expect(
      screen.getByRole('heading', { name: '3 plus 4 equals what?' }),
    ).toHaveAccessibleDescription('Question 2 of 5');
    screen.getByRole('button', { name: 'Answer 1: 6' }).focus();
    await user.keyboard(' ');
    expect(screen.getByRole('button', { name: 'Answer 1: 6' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    screen.getByRole('button', { name: 'Flip Card' }).focus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', { name: '3 plus 4 equals 7' }),
    ).toHaveFocus();
    rerender(
      <QuestionCard
        {...props}
        question={{ ...question, id: 'next-question' }}
        questionNumber={3}
      />,
    );
    expect(
      screen.getByRole('heading', { name: '3 plus 4 equals what?' }),
    ).toHaveFocus();
  });
  it('responds to reduced motion and still honors the app animation preference', () => {
    let notify = () => {};
    const media = {
      matches: true,
      addEventListener: vi.fn((_type: string, listener: () => void) => {
        notify = listener;
      }),
      removeEventListener: vi.fn(),
    };
    vi.stubGlobal('matchMedia', () => media);
    const { rerender, unmount } = render(<QuestionCard {...props} />);
    expect(screen.getByRole('region')).toHaveAttribute('data-animate', 'false');
    act(() => {
      media.matches = false;
      notify();
    });
    expect(screen.getByRole('region')).toHaveAttribute('data-animate', 'true');
    rerender(<QuestionCard {...props} animationEnabled={false} />);
    expect(screen.getByRole('region')).toHaveAttribute('data-animate', 'false');
    unmount();
    expect(media.removeEventListener).toHaveBeenCalled();
  });
});
