import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../app/App';
import {
  createStorageService,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
} from '../services/storageService';
import {
  startPracticeSession,
  recordPracticeResult,
  endPracticeSession,
} from '../services/practiceSession';
import type { MathOperation, DifficultyLevel } from '../types/question';

afterEach(() => vi.restoreAllMocks());
function seed() {
  const storage = createStorageService();
  storage.saveSettings({ ...DEFAULT_SETTINGS, showExplanations: false });
  const make = (
    operation: MathOperation,
    difficulty: DifficultyLevel,
    reports: boolean[],
    day: number,
    completed = true,
  ) => {
    let state = startPracticeSession({
      operations: [operation],
      difficulty,
      sessionLength: 5,
      mode: 'regular',
    });
    for (const report of reports)
      state = recordPracticeResult(state, {
        questionId: state.currentQuestion!.id,
        selectedAnswer: state.currentQuestion!.choices[0],
        selfReportedCorrect: report,
      });
    if (completed) state = endPracticeSession(state);
    state.session.startedAt = new Date(
      Date.UTC(2026, 9, day, 12),
    ).toISOString();
    if (completed)
      state.session.completedAt = new Date(
        Date.UTC(2026, 9, day, 12, 1),
      ).toISOString();
    for (const attempt of state.attempts)
      attempt.attemptedAt = new Date(
        Date.UTC(2026, 9, day, 12, 0, 30),
      ).toISOString();
    storage.saveSession(state);
  };
  make('addition', 1, [true, false], 20);
  make('division', 4, [true], 21);
  make('subtraction', 2, [], 22, false);
}
async function mount(path = '/statistics') {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  await screen.findByRole('main');
  return view;
}
describe('statistics page', () => {
  it('shows all zero buckets, useful empty states and disabled reset for new users', async () => {
    await mount();
    expect(
      screen.getByRole('heading', { name: 'Statistics', level: 1 }),
    ).toHaveFocus();
    expect(screen.getByLabelText('Overall statistics')).toHaveTextContent(
      'Attempted0Correct0Incorrect0Accuracy0%',
    );
    expect(screen.getByText('No answers recorded yet.')).toBeVisible();
    expect(screen.getByText('No sessions yet.')).toBeVisible();
    expect(screen.getAllByRole('article')).toHaveLength(8);
    expect(
      screen.getByRole('button', { name: 'Reset Statistics' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('link', { name: 'Start Practice' }),
    ).toHaveAttribute('href', '/practice/setup');
  });
  it('loads saved totals, every breakdown and newest-first session details including unfinished sessions', async () => {
    seed();
    await mount();
    expect(screen.getByLabelText('Overall statistics')).toHaveTextContent(
      'Attempted3Correct2Incorrect1Accuracy67%',
    );
    expect(screen.getByLabelText('Addition statistics')).toHaveTextContent(
      'Attempted2Correct1Incorrect1Accuracy50%',
    );
    expect(screen.getByLabelText('Division statistics')).toHaveTextContent(
      'Attempted1Correct1Incorrect0Accuracy100%',
    );
    expect(screen.getByLabelText('Beginner statistics')).toHaveTextContent(
      'Attempted2Correct1Incorrect1Accuracy50%',
    );
    expect(screen.getByLabelText('Advanced statistics')).toHaveTextContent(
      'Attempted1Correct1Incorrect0Accuracy100%',
    );
    const sessions = within(
      screen.getByRole('region', { name: 'Recent sessions' }),
    ).getAllByRole('listitem');
    expect(sessions).toHaveLength(3);
    expect(sessions[0].querySelector('time')).toHaveAttribute(
      'datetime',
      '2026-10-22T12:00:00.000Z',
    );
    expect(sessions[0]).toHaveTextContent('In progress');
    expect(sessions[1]).toHaveTextContent('Completed');
    expect(sessions[1]).toHaveTextContent('Division · Advanced');
    expect(sessions[1]).toHaveTextContent(
      'Attempted1Correct1Incorrect0Accuracy100%',
    );
  });
  it('traps dialog focus, cancels with Escape and restores focus without changing history', async () => {
    seed();
    const before = localStorage.getItem(STORAGE_KEYS.history);
    const user = userEvent.setup();
    await mount();
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));
    expect(
      screen.getByRole('alertdialog', { name: 'Reset statistics?' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Keep history' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(
      screen.getByRole('button', { name: 'Erase practice history' }),
    ).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Keep history' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Reset Statistics' }),
    ).toHaveFocus();
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(before);
  });
  it('clears persisted totals and sessions only after confirmation, including after remount, while retaining settings', async () => {
    seed();
    localStorage.setItem('unrelated', 'keep');
    const settings = localStorage.getItem(STORAGE_KEYS.settings);
    const user = userEvent.setup();
    const view = await mount();
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));
    await user.click(
      screen.getByRole('button', { name: 'Erase practice history' }),
    );
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Overall statistics')).toHaveTextContent(
      'Attempted0Correct0Incorrect0Accuracy0%',
    );
    expect(screen.getByText('No sessions yet.')).toBeVisible();
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBe(settings);
    expect(localStorage.getItem('unrelated')).toBe('keep');
    view.unmount();
    await mount();
    expect(screen.getByText('No answers recorded yet.')).toBeVisible();
    expect(createStorageService().getHistory()).toMatchObject({
      sessions: [],
      attempts: [],
    });
  });
  it('preserves displayed and saved history when resetting cannot be written', async () => {
    seed();
    const original = localStorage.getItem(STORAGE_KEYS.history);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    const user = userEvent.setup();
    await mount();
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));
    await user.click(
      screen.getByRole('button', { name: 'Erase practice history' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your history could not be erased.',
    );
    expect(screen.getByLabelText('Overall statistics')).toHaveTextContent(
      'Attempted3',
    );
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(original);
  });
  it('updates statistics during practice and discards the active session on confirmed reset', async () => {
    const user = userEvent.setup();
    await mount('/practice/setup');
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    await user.click(screen.getByRole('link', { name: 'Statistics' }));
    expect(screen.getByLabelText('Overall statistics')).toHaveTextContent(
      'Attempted1Correct0Incorrect1Accuracy0%',
    );
    expect(screen.getByText('In progress')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }));
    await user.click(
      screen.getByRole('button', { name: 'Erase practice history' }),
    );
    await user.click(screen.getByRole('link', { name: 'Settings' }));
    await user.click(
      await screen.findByRole('link', { name: 'Back to practice' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Choose your practice' }),
    ).toBeVisible();
    expect(createStorageService().getHistory().attempts).toEqual([]);
  });
});
