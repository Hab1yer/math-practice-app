import { StrictMode } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import PracticeSessionProvider from './PracticeSessionProvider';
import { usePracticeSession } from '../hooks/usePracticeSession';

function Harness() {
  const { state, startSession, recordResult, endSession } =
    usePracticeSession();
  function submit(order: 'competing' | 'end-first' | 'record-first') {
    const question = state!.currentQuestion!;
    const report = {
      questionId: question.id,
      selectedAnswer: question.choices[0],
      selfReportedCorrect: true,
    };
    if (order === 'end-first') endSession();
    recordResult(report);
    if (order === 'competing') {
      recordResult({ ...report, selfReportedCorrect: false });
      recordResult(report);
    }
    if (order === 'record-first') endSession();
  }
  return (
    <>
      <button
        onClick={() =>
          startSession({
            operations: ['addition'],
            difficulty: 1,
            sessionLength: 5,
            mode: 'regular',
          })
        }
      >
        Start
      </button>
      <button onClick={() => submit('competing')}>Competing reports</button>
      <button onClick={() => submit('end-first')}>End then report</button>
      <button onClick={() => submit('record-first')}>Report then end</button>
      <p data-testid="totals">
        {state
          ? `${state.session.attempted}/${state.session.correct}/${state.session.incorrect}/${state.attempts.length}/${state.isActive}`
          : 'none'}
      </p>
    </>
  );
}

describe('adversarial queued provider actions', () => {
  it.each([
    ['Competing reports', '1/1/0/1/true'],
    ['End then report', '0/0/0/0/false'],
    ['Report then end', '1/1/0/1/false'],
  ])('handles %s in one event under StrictMode', async (action, expected) => {
    const user = userEvent.setup();
    render(
      <StrictMode>
        <PracticeSessionProvider>
          <Harness />
        </PracticeSessionProvider>
      </StrictMode>,
    );
    await user.click(screen.getByRole('button', { name: 'Start' }));
    await user.click(screen.getByRole('button', { name: action }));
    expect(screen.getByTestId('totals')).toHaveTextContent(expected);
  });
});
