import { StrictMode } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';
import { createStorageService } from '../services/storageService';
import { seedReviewState } from '../test/reviewFixtures';

function seed() {
  const state = seedReviewState();
  state.session.startedAt = new Date(Date.now() - 60_000).toISOString();
  state.attempts[0].attemptedAt = new Date(Date.now() - 50_000).toISOString();
  state.session.completedAt = new Date(Date.now() - 40_000).toISOString();
  createStorageService().saveSession(state);
}
async function mount(path: string) {
  const view = render(
    <StrictMode>
      <RouterProvider
        router={createMemoryRouter([{ path: '*', element: <App /> }], {
          initialEntries: [path],
        })}
      />
    </StrictMode>,
  );
  await screen.findByRole('main');
  return view;
}
describe('complete review flow', () => {
  it('offers matching review, completes mastery and restores the separate mastered view', async () => {
    seed();
    const user = userEvent.setup();
    const view = await mount('/practice/setup');
    await user.click(
      screen.getByRole('radio', { name: 'Practice previous mistakes' }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      '1 active mistake pattern',
    );
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(
      screen.getByRole('heading', { level: 1, name: 'Mistake review' }),
    ).toBeVisible();
    for (let index = 0; index < 3; index++) {
      await user.keyboard('1');
      await user.click(screen.getByRole('button', { name: 'Flip Card' }));
      await user.dblClick(
        screen.getByRole('button', { name: 'I Got It Right' }),
      );
    }
    expect(
      screen.getByText('All mistakes matching this session are mastered.'),
    ).toBeVisible();
    expect(screen.getByLabelText('Practice details')).toHaveTextContent(
      'Review questions completed3',
    );
    expect(
      screen.getByRole('button', { name: 'Practice Again' }),
    ).toBeDisabled();
    view.unmount();
    await mount('/statistics');
    expect(
      screen.getByLabelText('Mistake review statistics'),
    ).toHaveTextContent(
      'Active patterns0Mastered patterns1Review questions practiced3Review answers correct3',
    );
    await user.click(screen.getByText('Mastered (1)', { selector: 'summary' }));
    expect(screen.getByText(/3 of 3 correct since last miss/)).toBeVisible();
  });
  it('blocks mismatched review and persists a configurable mastery goal', async () => {
    seed();
    const user = userEvent.setup();
    await mount('/settings');
    await user.selectOptions(
      screen.getByRole('combobox', {
        name: 'Correct reviews to master a pattern',
      }),
      '5',
    );
    expect(createStorageService().getSettings().masteryThreshold).toBe(5);
    await user.click(
      within(screen.getByRole('navigation')).getByRole('link', {
        name: 'Practice',
      }),
    );
    await user.click(
      screen.getByRole('radio', { name: 'Practice previous mistakes' }),
    );
    await user.click(screen.getByRole('radio', { name: /Advanced/ }));
    expect(
      screen.getByRole('button', { name: 'Start Session' }),
    ).toBeDisabled();
    expect(screen.getByRole('status')).toHaveTextContent(
      '0 match your operations and difficulty',
    );
  });
});
