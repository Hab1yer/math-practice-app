import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Question } from '../../types/question';
import QuestionCard from './QuestionCard';

const question: Question = {
  id: 'card-1',
  operation: 'multiplication',
  firstOperand: 8,
  secondOperand: 7,
  correctAnswer: 56,
  choices: [48, 54, 56, 64],
  difficulty: 3,
  displayText: '8 × 7 = ?',
  source: 'regular',
};

describe('question card', () => {
  it('requires selection, allows changes, and reveals both answers without scoring', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    render(
      <QuestionCard
        question={question}
        questionNumber={3}
        totalQuestions={10}
        onResult={onResult}
      />,
    );
    expect(screen.getByText('Question 3 of 10')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'I Got It Right' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Answer 1: 48' }));
    expect(
      screen.getByRole('button', { name: 'Answer 1: 48' }),
    ).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: 'Answer 2: 54' }));
    expect(
      screen.getByRole('button', { name: 'Answer 1: 48' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    expect(
      screen.getByRole('heading', { name: '8 multiplied by 7 equals 56' }),
    ).toHaveFocus();
    expect(screen.getByText('Your answer:').textContent).toContain('54');
    expect(
      screen.queryByRole('group', { name: 'Choose an answer' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Answer 1: 48', hidden: true }),
    ).toBeDisabled();
    expect(onResult).not.toHaveBeenCalled();
  });

  it.each([true, false])(
    'submits the self-reported result %s exactly once',
    async (result) => {
      const user = userEvent.setup();
      const onResult = vi.fn();
      render(
        <QuestionCard
          question={question}
          questionNumber={1}
          totalQuestions={5}
          onResult={onResult}
        />,
      );
      await user.click(
        screen.getByRole('button', {
          name: result ? 'Answer 1: 48' : 'Answer 3: 56',
        }),
      );
      await user.click(screen.getByRole('button', { name: 'Flip Card' }));
      const right = screen.getByRole('button', { name: 'I Got It Right' });
      const wrong = screen.getByRole('button', { name: 'I Got It Wrong' });
      fireEvent.click(result ? right : wrong);
      fireEvent.click(result ? wrong : right);
      expect(onResult).toHaveBeenCalledExactlyOnceWith(result);
      expect(right).toBeDisabled();
      expect(wrong).toBeDisabled();
      expect(screen.getByRole('status')).toHaveTextContent(
        result ? 'as correct' : 'as incorrect',
      );
      expect(screen.getByRole('status')).toHaveFocus();
    },
  );

  it('resets selection, flip state and submission lock for a new question', async () => {
    const user = userEvent.setup();
    const onResult = vi.fn();
    const { rerender } = render(
      <QuestionCard
        question={question}
        questionNumber={1}
        totalQuestions={5}
        onResult={onResult}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Answer 1: 48' }));
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    rerender(
      <QuestionCard
        question={{ ...question, id: 'card-2' }}
        questionNumber={2}
        totalQuestions={5}
        onResult={onResult}
      />,
    );
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Answer 1: 48' }),
    ).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(
      screen.getByRole('heading', { name: '8 multiplied by 7 equals what?' }),
    ).toHaveFocus();
    await user.click(screen.getByRole('button', { name: 'Answer 3: 56' }));
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }));
    expect(onResult.mock.calls).toEqual([[false], [true]]);
  });

  it('works by keyboard without animation and can hide explanations', async () => {
    const user = userEvent.setup();
    render(
      <QuestionCard
        question={question}
        questionNumber={1}
        totalQuestions="continuous"
        onResult={vi.fn()}
        animationEnabled={false}
        showExplanations={false}
      />,
    );
    expect(
      screen.getByRole('region', { name: 'Math question card' }),
    ).toHaveAttribute('data-animate', 'false');
    expect(screen.getByText('Question 1 · Continuous practice')).toBeVisible();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Answer 1: 48' })).toHaveFocus();
    await user.keyboard('{Enter}');
    const group = screen.getByRole('group', { name: 'Choose an answer' });
    expect(
      within(group).getByRole('button', { name: 'Answer 1: 48' }),
    ).toHaveAttribute('aria-pressed', 'true');
    screen.getByRole('button', { name: 'Flip Card' }).focus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('button', { name: 'I Got It Right' }),
    ).toBeEnabled();
    expect(
      screen.queryByText('8 groups of 7 make 56.'),
    ).not.toBeInTheDocument();
  });
});
