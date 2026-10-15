import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('application foundation', () => {
  it('introduces the app and makes the current availability clear', () => {
    render(<App />);
    expect(
      screen.getByRole('main', { name: 'Math Practice' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Math Practice' }),
    ).toBeVisible();
    expect(screen.getByText(/math adventures are coming next/i)).toBeVisible();
    expect(
      screen.queryByRole('button', { name: /start practice/i }),
    ).not.toBeInTheDocument();
  });
});
