import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../app/App';

function renderSetup(path = '/practice/setup') {
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('practice configuration', () => {
  it('starts with sensible defaults and explains unavailable review', () => {
    renderSetup();
    expect(screen.getByRole('checkbox', { name: 'Addition' })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Beginner/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /10 questions/ })).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Regular practice' }),
    ).toBeChecked();
    expect(
      screen.getByRole('radio', { name: 'Practice previous mistakes' }),
    ).toBeDisabled();
    expect(screen.getByText(/No mistakes to review yet/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled();
  });

  it('blocks an empty operation selection and supports selecting all', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('checkbox', { name: 'Addition' }));
    expect(
      screen.getByRole('button', { name: 'Start Session' }),
    ).toBeDisabled();
    expect(
      screen.getByText('Choose at least one operation to start your session.'),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Select all operations' }),
    );
    for (const checkbox of screen.getAllByRole('checkbox'))
      expect(checkbox).toBeChecked();
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeEnabled();
  });

  it('passes mixed operations, difficulty and continuous length and retains them for editing', async () => {
    const user = userEvent.setup();
    renderSetup();
    await user.click(screen.getByRole('checkbox', { name: 'Division' }));
    await user.click(screen.getByRole('radio', { name: /Advanced/ }));
    await user.click(screen.getByRole('radio', { name: /Continuous/ }));
    expect(screen.getByRole('radio', { name: /Beginner/ })).not.toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    const summary = screen.getByLabelText('Selected practice configuration');
    expect(within(summary).getByText('Addition, Division')).toBeVisible();
    expect(screen.getByText('Advanced')).toBeVisible();
    expect(screen.getByText('Continuous')).toBeVisible();
    expect(screen.getByText('Regular practice')).toBeVisible();
    expect(screen.getByText(/Try one card with your choices/)).toBeVisible();
    await user.click(
      screen.getByRole('link', { name: 'Change practice choices' }),
    );
    expect(screen.getByRole('checkbox', { name: 'Division' })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Advanced/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Continuous/ })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: /5 questions/ }));
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    expect(screen.getByText('5 questions')).toBeVisible();
  });

  it('supports keyboard toggles and exclusive radio choices', async () => {
    const user = userEvent.setup();
    renderSetup();
    const addition = screen.getByRole('checkbox', { name: 'Addition' });
    addition.focus();
    await user.keyboard(' ');
    expect(addition).not.toBeChecked();
    await user.tab();
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toHaveFocus();
    await user.keyboard(' ');
    expect(screen.getByRole('checkbox', { name: 'Subtraction' })).toBeChecked();
    const difficulty = screen.getByRole('group', {
      name: '2. Choose your challenge',
    });
    within(difficulty)
      .getByRole('radio', { name: /Beginner/ })
      .focus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: /Easy/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Beginner/ })).not.toBeChecked();
  });

  it('guides a direct session visit back to configuration', async () => {
    const user = userEvent.setup();
    renderSetup('/practice/session');
    expect(
      screen.getByText(/Choose what you’d like to practice first/),
    ).toBeVisible();
    await user.click(
      screen.getByRole('link', { name: 'Choose your practice' }),
    );
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeVisible();
  });
});
