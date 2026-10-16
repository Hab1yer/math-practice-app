import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

function renderRoute(path = '/') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('application navigation', () => {
  it.each([
    ['Start Practice', 'Choose your practice'],
    ['View Statistics', 'See your progress'],
    ['Settings', 'Make it your own'],
  ])('opens %s from home and returns home', async (action, title) => {
    const user = userEvent.setup();
    renderRoute();
    const home = screen.getByRole('main');
    await user.click(
      within(home).getByRole('link', { name: new RegExp(action) }),
    );

    const heading = screen.getByRole('heading', { level: 1, name: title });
    expect(heading).toHaveFocus();
    if (action === 'Start Practice') {
      expect(
        screen.getByRole('button', { name: 'Start Session' }),
      ).toBeEnabled();
    } else if (action === 'Settings') {
      expect(
        screen.getByRole('checkbox', { name: /Card animations/ }),
      ).toBeChecked();
    } else {
      expect(screen.getByText('Coming soon')).toBeVisible();
    }
    expect(document.title).toBe(`${title} | Math Practice`);
    await user.click(screen.getByRole('link', { name: 'Return Home' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Let’s make math click.' }),
    ).toBeVisible();
  });

  it.each([
    ['/practice/session', 'Your practice space'],
    ['/practice/summary', 'Your practice recap'],
  ])('renders the direct route %s', (path, title) => {
    renderRoute(path);
    expect(
      screen.getByRole('heading', { level: 1, name: title }),
    ).toBeVisible();
    expect(
      screen.getByRole('navigation', { name: 'Main navigation' }),
    ).toBeVisible();
  });

  it('offers a safe way home from an unknown route', async () => {
    const user = userEvent.setup();
    renderRoute('/missing-page');
    expect(
      screen.getByRole('heading', { name: 'Let’s find our way back.' }),
    ).toBeVisible();
    await user.click(screen.getByRole('link', { name: 'Return Home' }));
    expect(
      screen.getByRole('heading', { name: 'Let’s make math click.' }),
    ).toBeVisible();
  });

  it('supports keyboard navigation and identifies the active page', async () => {
    const user = userEvent.setup();
    renderRoute();
    await user.tab();
    expect(screen.getByRole('link', { name: /Start Practice/ })).toHaveFocus();
    await user.keyboard('{Enter}');
    const navigation = screen.getByRole('navigation');
    expect(
      within(navigation).getByRole('link', { name: 'Practice' }),
    ).toHaveAttribute('aria-current', 'page');
    expect(
      screen.getByRole('heading', { name: 'Choose your practice' }),
    ).toHaveFocus();
  });
});
