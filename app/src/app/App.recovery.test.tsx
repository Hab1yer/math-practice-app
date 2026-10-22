import { StrictMode } from 'react';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';
import { createStorageService } from '../services/storageService';

function mount(path = '/practice/setup') {
  const router = createMemoryRouter([{ path: '*', element: <App /> }], {
    initialEntries: [path],
  });
  return {
    ...render(
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>,
    ),
    router,
  };
}
describe('refresh recovery and navigation safety', () => {
  it('keeps skip-link history inside the router without triggering a leave warning', async () => {
    const user = userEvent.setup();
    const { router } = mount();
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await user.click(screen.getByRole('link', { name: 'Skip to content' }));
    expect(router.state.location.hash).toBe('#main-content');
    expect(screen.getByRole('main')).toHaveFocus();
    await act(async () => {
      await router.navigate(-1);
    });
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/practice/session');
  });
  it('completes a fixed session without a stale leave warning', async () => {
    const user = userEvent.setup();
    mount();
    await user.click(screen.getByRole('radio', { name: /5 questions/ }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    for (let index = 0; index < 5; index++) {
      await user.keyboard('1');
      await user.click(screen.getByRole('button', { name: 'Flip Card' }));
      await user.click(screen.getByRole('button', { name: 'I Got It Right' }));
    }
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Session complete' }),
    ).toBeVisible();
  });
  it('remounts a revealed card and records its report exactly once', async () => {
    const user = userEvent.setup();
    let view = mount();
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await user.keyboard('2');
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    const question =
      createStorageService().getActiveSession()!.currentQuestion!;
    view.unmount();
    view = mount('/practice/session');
    expect(screen.getByText('Your answer:')).toHaveTextContent(
      String(question.choices[1]),
    );
    expect(
      screen.getByRole('button', { name: 'I Got It Wrong' }),
    ).toBeVisible();
    await user.dblClick(screen.getByRole('button', { name: 'I Got It Wrong' }));
    expect(createStorageService().getHistory().attempts).toHaveLength(1);
    expect(screen.getByText('Question 2 of 10')).toBeVisible();
    view.unmount();
    mount('/');
    await user.click(
      screen.getByRole('link', { name: /Resume your saved session/ }),
    );
    expect(screen.getByText('Question 2 of 10')).toBeVisible();
  });
  it('cancels link and back navigation, blocks shortcuts in the dialog, then ends and leaves', async () => {
    const user = userEvent.setup();
    const { router } = mount();
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Statistics',
      }),
    );
    expect(
      screen.getByRole('alertdialog', { name: 'Leave this session?' }),
    ).toBeVisible();
    await user.keyboard('1{Escape}');
    expect(router.state.location.pathname).toBe('/practice/session');
    expect(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Statistics',
      }),
    ).toHaveFocus();
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled();
    await act(async () => {
      await router.navigate(-1);
    });
    expect(screen.getByRole('alertdialog')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Keep practicing' }));
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Statistics',
      }),
    );
    await user.click(screen.getByRole('button', { name: 'End and leave' }));
    await screen.findByRole('heading', { name: 'Statistics', level: 1 });
    expect(createStorageService().getActiveSession()).toBeNull();
    expect(createStorageService().getHistory().sessions[0].attempted).toBe(0);
    expect(
      createStorageService().getHistory().sessions[0].completedAt,
    ).toBeTruthy();
  });
  it('requests native page-leave confirmation only during active practice', async () => {
    const user = userEvent.setup();
    mount();
    const idle = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(idle);
    expect(idle.defaultPrevented).toBe(false);
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    const active = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(active);
    expect(active.defaultPrevented).toBe(true);
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    await user.click(screen.getByRole('button', { name: 'End session now' }));
    const ended = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(ended);
    expect(ended.defaultPrevented).toBe(false);
  });
});
