import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../app/App';
import { createStorageService } from '../services/storageService';

function setup() {
  render(
    <MemoryRouter initialEntries={['/practice/setup']}>
      <App />
    </MemoryRouter>,
  );
}
describe('full practice flow', () => {
  it('advances and resets cards, updates progress, and completes five questions', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('radio', { name: /5 questions/ }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    for (let index = 0; index < 5; index++) {
      expect(screen.getByText(`Question ${index + 1} of 5`)).toBeVisible();
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'value',
        String(index),
      );
      expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled();
      await user.click(
        screen.getAllByRole('button', { name: /Answer \d:/ })[0],
      );
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'value',
        String(index),
      );
      await user.click(screen.getByRole('button', { name: 'Flip Card' }));
      expect(screen.getByRole('progressbar')).toHaveAttribute(
        'value',
        String(index),
      );
      await user.click(
        screen.getByRole('button', {
          name: index % 2 === 0 ? 'I Got It Right' : 'I Got It Wrong',
        }),
      );
    }
    expect(
      screen.getByRole('heading', { name: 'Session complete' }),
    ).toBeVisible();
    const totals = screen.getByLabelText('Session totals');
    expect(totals).toHaveTextContent('Attempted5');
    expect(totals).toHaveTextContent('Correct3');
    expect(totals).toHaveTextContent('Incorrect2');
    const saved = createStorageService().getHistory();
    expect(saved.attempts).toHaveLength(5);
    expect(saved.sessions[0]).toMatchObject({
      attempted: 5,
      correct: 3,
      incorrect: 2,
    });
    expect(saved.sessions[0].completedAt).toBeTruthy();
    expect(screen.getByText('60%')).toBeVisible();
    expect(screen.getByLabelText('Practice details')).toHaveTextContent(
      'OperationsAdditionDifficultyBeginnerReview questions completed0',
    );
    expect(
      screen.queryByRole('region', { name: 'Math question card' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Practice Again' }));
    expect(screen.getByText('Question 1 of 5')).toBeVisible();
    expect(screen.getByLabelText('Current session totals')).toHaveTextContent(
      'Attempted0Correct0Incorrect0',
    );
  });
  it('supports cancelling and confirming continuous practice and excludes unanswered cards', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('radio', { name: /Continuous/ }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    expect(
      screen.getByRole('alertdialog', { name: 'End this session?' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Keep practicing' }),
    ).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Session' })).toHaveFocus();
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    expect(screen.getByText('Question 2 · Continuous practice')).toBeVisible();
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    await user.click(screen.getByRole('button', { name: 'End session now' }));
    expect(
      screen.getByRole('heading', { name: 'Session complete' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Session totals')).toHaveTextContent(
      'Attempted1Correct0Incorrect1',
    );
  });
  it('retains an in-memory session when visiting settings', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }));
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Settings',
      }),
    );
    await user.click(screen.getByRole('checkbox', { name: /Card animations/ }));
    await user.click(screen.getByRole('link', { name: 'Back to practice' }));
    expect(screen.getByText('Question 2 of 10')).toBeVisible();
    expect(
      screen.getByRole('region', { name: 'Math question card' }),
    ).toHaveAttribute('data-animate', 'false');
  });
});
