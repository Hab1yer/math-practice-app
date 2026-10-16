import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../app/App';

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
    await user.click(
      screen.getByRole('link', { name: 'Choose your practice' }),
    );
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(
      screen.getByRole('region', { name: 'Math question card' }),
    ).toHaveAttribute('data-animate', 'false');
    await user.click(screen.getAllByRole('button', { name: /Answer \d:/ })[0]);
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    expect(screen.queryByText(/plus .* makes/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'I Got It Wrong' }));
    await user.click(screen.getByRole('button', { name: 'Try another card' }));
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled();
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });
});
