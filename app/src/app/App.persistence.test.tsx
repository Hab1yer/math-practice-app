import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { createStorageService, STORAGE_KEYS } from '../services/storageService';

afterEach(() => vi.restoreAllMocks());
async function mount(path: string) {
  const view = render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  );
  await screen.findByRole('main');
  return view;
}
describe('application persistence', () => {
  it('restores both selected preferences after the entire app remounts', async () => {
    const user = userEvent.setup();
    const view = await mount('/settings');
    await user.click(screen.getByRole('checkbox', { name: /Card animations/ }));
    await user.click(
      screen.getByRole('checkbox', { name: /Show explanations/ }),
    );
    view.unmount();
    await mount('/settings');
    expect(
      screen.getByRole('checkbox', { name: /Card animations/ }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: /Show explanations/ }),
    ).not.toBeChecked();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
  it('saves only reports, timestamps ending, and retains history after app restart without resuming the active card', async () => {
    const user = userEvent.setup();
    const view = await mount('/practice/setup');
    await user.click(
      screen.getByRole('button', { name: 'Select all operations' }),
    );
    await user.click(screen.getByRole('radio', { name: /Advanced/ }));
    await user.click(screen.getByRole('radio', { name: /5 questions/ }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    expect(createStorageService().getHistory().attempts).toHaveLength(0);
    await user.dblClick(screen.getByRole('button', { name: 'I Got It Wrong' }));
    const history = createStorageService().getHistory();
    expect(history.attempts).toHaveLength(1);
    expect(history.attempts[0].selfReportedCorrect).toBe(false);
    const patterns = createStorageService().getMistakePatterns();
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toMatchObject({
      operation: history.attempts[0].operation,
      incorrectCount: 1,
      similarCorrectCount: 0,
      mastered: false,
    });
    expect(history.sessions[0]).toMatchObject({
      attempted: 1,
      correct: 0,
      incorrect: 1,
    });
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    await user.click(screen.getByRole('button', { name: 'End session now' }));
    expect(
      createStorageService().getHistory().sessions[0].completedAt,
    ).toBeTruthy();
    view.unmount();
    const recap = await mount('/practice/summary');
    expect(
      screen.getByRole('heading', { name: 'Session complete' }),
    ).toBeVisible();
    expect(screen.getByLabelText('Session totals')).toHaveTextContent(
      'Attempted1Correct0Incorrect1',
    );
    await user.click(screen.getByRole('link', { name: 'Change Settings' }));
    expect(screen.getByRole('radio', { name: /Advanced/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /5 questions/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
    recap.unmount();
    await mount('/practice/session');
    expect(
      screen.getByRole('heading', { name: 'Choose your practice' }),
    ).toBeVisible();
    expect(createStorageService().getHistory().attempts).toEqual(
      history.attempts,
    );
    expect(createStorageService().getMistakePatterns()).toEqual(patterns);
  });
  it('keeps a complete interaction usable with a saving-space warning when writes fail', async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Full', 'QuotaExceededError');
    });
    await mount('/practice/setup');
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(
      screen.getByRole('status', { name: 'Saving status' }),
    ).toHaveTextContent(/out of saving space/);
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Right' }));
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    await user.click(screen.getByRole('button', { name: 'End session now' }));
    expect(screen.getByText('100%')).toBeVisible();
    expect(
      screen.getByRole('status', { name: 'Saving status' }),
    ).toHaveTextContent(/out of saving space/);
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBeNull();
  });
  it('shows a friendly warning and usable settings if the browser denies storage access', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('Denied', 'SecurityError');
    });
    await mount('/settings');
    expect(
      screen.getByRole('status', { name: 'Saving status' }),
    ).toHaveTextContent(/Saving is unavailable/);
    expect(
      screen.getByRole('checkbox', { name: /Card animations/ }),
    ).toBeChecked();
  });
});
