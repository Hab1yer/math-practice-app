import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../app/App';
import {
  createStorageService,
  DEFAULT_SETTINGS,
  STORAGE_KEYS,
} from '../services/storageService';
import { startPracticeSession } from '../services/practiceSession';
import * as sound from '../services/soundService';

afterEach(() => vi.restoreAllMocks());
async function mount(path = '/settings') {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
  await screen.findByRole('main');
  return view;
}

describe('saved settings and application clearing', () => {
  it('persists defaults and loads them into a new setup after a full remount', async () => {
    const user = userEvent.setup();
    const view = await mount();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeDisabled();
    await user.click(screen.getByRole('checkbox', { name: 'Division' }));
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Default difficulty' }),
      '4',
    );
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Default session length' }),
      'continuous',
    );
    await user.click(screen.getByRole('checkbox', { name: /Sound effects/ }));
    expect(createStorageService().getSettings()).toMatchObject({
      defaultOperations: ['division'],
      defaultDifficulty: 4,
      defaultSessionLength: 'continuous',
      soundEnabled: true,
    });
    view.unmount();
    await mount('/practice/setup');
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
    expect(
      screen.getByRole('checkbox', { name: 'Addition' }),
    ).not.toBeChecked();
    expect(screen.getByRole('radio', { name: /Advanced/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Continuous/ })).toBeChecked();
  });
  it('allows session overrides without changing saved defaults', async () => {
    createStorageService().saveSettings({
      ...DEFAULT_SETTINGS,
      defaultDifficulty: 4,
      defaultSessionLength: 'continuous',
    });
    const user = userEvent.setup();
    await mount('/practice/setup');
    await user.click(screen.getByRole('radio', { name: /Beginner/ }));
    await user.click(screen.getByRole('radio', { name: /5 questions/ }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(screen.getByText('Question 1 of 5')).toBeVisible();
    expect(screen.getByText('Addition · Beginner')).toBeVisible();
    expect(createStorageService().getSettings()).toMatchObject({
      defaultDifficulty: 4,
      defaultSessionLength: 'continuous',
    });
  });
  it('changing defaults replaces previous setup choices but leaves the current question configuration alone', async () => {
    const user = userEvent.setup();
    await mount('/practice/setup');
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await user.click(screen.getByRole('link', { name: 'Settings' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Default difficulty' }),
      '4',
    );
    await user.click(screen.getByRole('link', { name: 'Back to practice' }));
    expect(screen.getByText('Addition · Beginner')).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Practice' }));
    expect(screen.getByRole('radio', { name: /Advanced/ })).toBeChecked();
  });
  it('cancels clearing safely, then confirms clearing all app data and returns home with defaults', async () => {
    const store = createStorageService();
    store.saveSettings({
      ...DEFAULT_SETTINGS,
      soundEnabled: true,
      defaultDifficulty: 4,
    });
    store.saveSession(
      startPracticeSession({
        operations: ['addition'],
        difficulty: 1,
        sessionLength: 5,
        mode: 'regular',
      }),
    );
    localStorage.setItem('mathPractice.mistakePatterns', '[{"old":true}]');
    localStorage.setItem('another-app', 'keep');
    const original = localStorage.getItem(STORAGE_KEYS.history);
    const user = userEvent.setup();
    await mount();
    await user.click(
      screen.getByRole('button', { name: 'Clear All Application Data' }),
    );
    expect(
      screen.getByRole('alertdialog', { name: 'Clear all application data?' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Keep my data' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(
      screen.getByRole('button', { name: 'Clear All Application Data' }),
    ).toHaveFocus();
    expect(localStorage.getItem(STORAGE_KEYS.history)).toBe(original);
    await user.click(
      screen.getByRole('button', { name: 'Clear All Application Data' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Erase all application data' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Let’s make math click.' }),
    ).toBeVisible();
    expect(createStorageService().getSettings()).toEqual(DEFAULT_SETTINGS);
    expect(createStorageService().getHistory()).toMatchObject({
      sessions: [],
      attempts: [],
    });
    expect(localStorage.getItem('mathPractice.mistakePatterns')).toBeNull();
    expect(localStorage.getItem('another-app')).toBe('keep');
    await user.click(screen.getByRole('link', { name: 'Settings' }));
    expect(
      screen.getByRole('checkbox', { name: /Sound effects/ }),
    ).not.toBeChecked();
    expect(
      screen.getByRole('combobox', { name: 'Default difficulty' }),
    ).toHaveValue('1');
    await user.click(screen.getByRole('link', { name: 'Back to practice' }));
    expect(
      screen.getByRole('heading', { name: 'Choose your practice' }),
    ).toBeVisible();
  });
  it('keeps the user in Settings with an error when clearing fails', async () => {
    const store = createStorageService();
    store.saveSettings({ ...DEFAULT_SETTINGS, soundEnabled: true });
    const original = localStorage.getItem(STORAGE_KEYS.settings);
    const remove = Storage.prototype.removeItem;
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (
      this: Storage,
      key,
    ) {
      if (key === STORAGE_KEYS.settings)
        throw new DOMException('Denied', 'SecurityError');
      remove.call(this, key);
    });
    const user = userEvent.setup();
    await mount();
    await user.click(
      screen.getByRole('button', { name: 'Clear All Application Data' }),
    );
    await user.click(
      screen.getByRole('button', { name: 'Erase all application data' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Application data could not be fully cleared.',
    );
    expect(screen.getByRole('heading', { name: 'Settings' })).toBeVisible();
    expect(
      screen.getByRole('checkbox', { name: /Sound effects/ }),
    ).toBeChecked();
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBe(original);
  });
  it('plays one opted-in tone per reported answer and stops playing when disabled', async () => {
    const play = vi
      .spyOn(sound, 'playAnswerSound')
      .mockImplementation(() => {});
    const user = userEvent.setup();
    await mount();
    await user.click(screen.getByRole('checkbox', { name: /Sound effects/ }));
    await user.click(screen.getByRole('link', { name: 'Back to practice' }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    expect(play).not.toHaveBeenCalled();
    await user.dblClick(screen.getByRole('button', { name: 'I Got It Right' }));
    expect(play).toHaveBeenCalledExactlyOnceWith(true);
    await user.click(screen.getByRole('link', { name: 'Settings' }));
    await user.click(screen.getByRole('checkbox', { name: /Sound effects/ }));
    await user.click(screen.getByRole('link', { name: 'Back to practice' }));
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    expect(play).toHaveBeenCalledTimes(1);
  });
});

describe('card preview preferences', () => {
  it('connects animation/explanation settings to a new preview and resets the next card', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/settings']}>
        <App />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('checkbox', { name: /Card animations/ }));
    await user.click(
      screen.getByRole('checkbox', { name: /Show explanations/ }),
    );
    await user.click(screen.getByRole('link', { name: 'Back to practice' }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(
      screen.getByRole('region', { name: 'Math question card' }),
    ).toHaveAttribute('data-animate', 'false');
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    expect(screen.queryByText(/plus .* makes/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    expect(screen.getByText('Question 2 of 10')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled();
    expect(
      screen.getByRole('status', { name: 'Card result' }),
    ).toBeEmptyDOMElement();
  });
});
