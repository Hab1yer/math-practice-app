import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';
afterEach(() => vi.restoreAllMocks());
function Broken(): never {
  throw new Error('Internal stack and private diagnostic');
}
describe('render failure recovery', () => {
  it('shows safe copy and a home action without exposing the exception', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'This page could not be opened',
    );
    expect(screen.queryByText(/Internal stack/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Return Home' })).toBeVisible();
  });
});
