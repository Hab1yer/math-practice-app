import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import App from './App';

async function check() {
  // jsdom has no canvas/text layout; measured contrast is checked in the live browser.
  const canvas = vi
    .spyOn(HTMLCanvasElement.prototype, 'getContext')
    .mockImplementation(() => null);
  try {
    const result = await axe.run(document.body, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(
      result.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.target),
      })),
    ).toEqual([]);
  } finally {
    canvas.mockRestore();
  }
}
describe('automated accessibility structure', () => {
  it.each([
    '/',
    '/practice/setup',
    '/statistics',
    '/settings',
    '/privacy',
    '/missing',
  ])('checks %s using axe', async (path) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    );
    await screen.findByRole('main');
    await check();
    cleanup();
  });
  it('checks front, reveal and confirmation states of a practice card', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={['/practice/setup']}>
        <App />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: 'Start Session' }));
    await check();
    await user.keyboard('1');
    await user.click(screen.getByRole('button', { name: 'Flip Card' }));
    await check();
    await user.click(screen.getByRole('button', { name: 'End Session' }));
    await check();
  });
});
