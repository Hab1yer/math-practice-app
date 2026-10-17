import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from '../app/App';
import SessionSummaryPage from './SessionSummaryPage';
import { PracticeSessionContext } from '../app/practiceSessionContext';
import { PracticeConfigurationContext } from '../app/practiceConfigurationContext';
import {
  startPracticeSession,
  recordPracticeResult,
  endPracticeSession,
} from '../services/practiceSession';

async function finishEmptySession() {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={['/practice/setup']}>
      <App />
    </MemoryRouter>,
  );
  await user.click(
    screen.getByRole('button', { name: 'Select all operations' }),
  );
  await user.click(screen.getByRole('radio', { name: /Advanced/ }));
  await user.click(screen.getByRole('radio', { name: /Continuous/ }));
  await user.click(screen.getByRole('button', { name: 'Start Session' }));
  await user.click(screen.getByRole('button', { name: 'End Session' }));
  await user.click(screen.getByRole('button', { name: 'End session now' }));
  return user;
}

describe('session summary actions', () => {
  it('rounds accuracy and counts only completed review attempts', () => {
    let state = startPracticeSession({
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 'continuous',
      mode: 'regular',
    });
    for (let index = 0; index < 3; index++) {
      state = recordPracticeResult(state, {
        questionId: state.currentQuestion!.id,
        selectedAnswer: state.currentQuestion!.choices[0],
        selfReportedCorrect: index < 2,
      });
    }
    state = endPracticeSession(state);
    state.attempts[0] = { ...state.attempts[0], source: 'mistake-review' };
    render(
      <MemoryRouter>
        <PracticeSessionContext.Provider
          value={{
            state,
            error: null,
            startSession: () => false,
            recordResult: () => {},
            endSession: () => {},
          }}
        >
          <PracticeConfigurationContext.Provider
            value={{ configuration: null, setConfiguration: () => {} }}
          >
            <SessionSummaryPage />
          </PracticeConfigurationContext.Provider>
        </PracticeSessionContext.Provider>
      </MemoryRouter>,
    );
    expect(screen.getByText('67%')).toBeVisible();
    expect(screen.getByLabelText('Practice details')).toHaveTextContent(
      'Review questions completed1',
    );
  });
  it('handles zero attempts and restarts the same configuration with fresh totals and card', async () => {
    const user = await finishEmptySession();
    expect(screen.getByText('0%')).toBeVisible();
    expect(screen.getByText(/No answers recorded yet/)).toBeVisible();
    expect(screen.getByLabelText('Practice details')).toHaveTextContent(
      'Addition, Subtraction, Multiplication, Division',
    );
    expect(screen.getByLabelText('Practice details')).toHaveTextContent(
      'Advanced',
    );
    expect(
      screen.getByRole('button', { name: 'Practice Mistakes' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Practice Mistakes' }),
    ).toHaveAccessibleDescription(/Mistake review is coming soon/);
    expect(
      screen.getByRole('link', { name: 'View Statistics' }),
    ).toHaveAttribute('href', '/statistics');
    expect(screen.getByRole('link', { name: 'Return Home' })).toHaveAttribute(
      'href',
      '/',
    );
    await user.click(screen.getByRole('button', { name: 'Practice Again' }));
    expect(screen.getByText('Question 1 · Continuous practice')).toBeVisible();
    expect(screen.getByText(/Division · Advanced/)).toBeVisible();
    expect(screen.getByLabelText('Current session totals')).toHaveTextContent(
      'Attempted0Correct0Incorrect0',
    );
    expect(screen.getByRole('button', { name: 'Flip Card' })).toBeDisabled();
  });

  it('opens practice configuration with previous choices retained', async () => {
    const user = await finishEmptySession();
    await user.click(screen.getByRole('link', { name: 'Change Settings' }));
    expect(
      screen.getByRole('heading', { name: 'Choose your practice' }),
    ).toBeVisible();
    expect(screen.getByRole('radio', { name: /Advanced/ })).toBeChecked();
    expect(screen.getByRole('radio', { name: /Continuous/ })).toBeChecked();
    for (const operation of [
      'Addition',
      'Subtraction',
      'Multiplication',
      'Division',
    ]) {
      expect(screen.getByRole('checkbox', { name: operation })).toBeChecked();
    }
  });
});
