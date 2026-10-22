import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import ConfirmationDialog from '../components/layout/ConfirmationDialog';
import StatisticsTotals from '../components/practice/StatisticsTotals';
import { PracticeHistoryContext } from '../app/practiceHistoryContext';
import { PracticeHistoryActionsContext } from '../app/practiceHistoryActionsContext';
import { usePracticeSession } from '../hooks/usePracticeSession';
import {
  calculateStatistics,
  recentSessions,
} from '../services/statisticsService';
import { operationOptions, difficultyOptions } from '../utils/practiceOptions';

const sessionDate = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
export default function StatisticsPage() {
  const history = useContext(PracticeHistoryContext);
  const { resetHistory } = useContext(PracticeHistoryActionsContext);
  const { state } = usePracticeSession();
  const totals = useMemo(
    () => calculateStatistics(history.attempts),
    [history.attempts],
  );
  const recent = useMemo(
    () => recentSessions(history.sessions),
    [history.sessions],
  );
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const resetButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !confirmReset) resetButton.current?.focus();
    wasOpen.current = confirmReset;
  }, [confirmReset]);
  function confirm() {
    if (!resetHistory())
      setResetError(
        'Your history could not be erased. It is still here. Please try again when saving is available.',
      );
    setConfirmReset(false);
  }
  return (
    <PageContainer title="Statistics">
      <div inert={confirmReset}>
        <p className="field-hint">
          Based on the answers you marked right or wrong. History stays in this
          browser.
        </p>
        <StatisticsTotals totals={totals} label="Overall statistics" overview />
        {totals.attempted === 0 && (
          <div className="statistics-empty">
            <p>No answers recorded yet.</p>
            <Link className="button-link" to="/practice/setup">
              Start Practice <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
        <section
          className="statistics-section"
          aria-labelledby="operation-stats-title"
        >
          <h2 id="operation-stats-title">By operation</h2>
          <div className="statistics-grid">
            {operationOptions.map((option) => (
              <article
                className="statistics-card"
                key={option.value}
                aria-labelledby={`stats-${option.value}`}
              >
                <h3 id={`stats-${option.value}`}>
                  <span className="statistics-symbol" aria-hidden="true">
                    {option.symbol}
                  </span>
                  {option.label}
                </h3>
                <StatisticsTotals
                  totals={totals.byOperation[option.value]}
                  label={`${option.label} statistics`}
                />
              </article>
            ))}
          </div>
        </section>
        <section
          className="statistics-section"
          aria-labelledby="difficulty-stats-title"
        >
          <h2 id="difficulty-stats-title">By difficulty</h2>
          <div className="statistics-grid">
            {difficultyOptions.map((option) => (
              <article
                className="statistics-card"
                key={option.value}
                aria-labelledby={`stats-level-${option.value}`}
              >
                <h3 id={`stats-level-${option.value}`}>
                  {option.label}{' '}
                  <span className="statistics-level">Level {option.value}</span>
                </h3>
                <StatisticsTotals
                  totals={totals.byDifficulty[option.value]}
                  label={`${option.label} statistics`}
                />
              </article>
            ))}
          </div>
        </section>
        <section
          className="statistics-section"
          aria-labelledby="recent-sessions-title"
        >
          <h2 id="recent-sessions-title">Recent sessions</h2>
          <p className="field-hint">
            Latest 10 sessions. Unfinished sessions include only reported
            answers.
          </p>
          {recent.length === 0 ? (
            <p>No sessions yet.</p>
          ) : (
            <ol className="recent-sessions">
              {recent.map((session) => (
                <li key={session.id} className="recent-session">
                  <div className="recent-session-heading">
                    <time dateTime={session.startedAt}>
                      {sessionDate.format(new Date(session.startedAt))}
                    </time>
                    <span className="session-status">
                      {session.completedAt
                        ? 'Completed'
                        : state?.isActive && state.session.id === session.id
                          ? 'In progress'
                          : 'Unfinished'}
                    </span>
                  </div>
                  <p>
                    {operationOptions
                      .filter((option) =>
                        session.operations.includes(option.value),
                      )
                      .map((option) => option.label)
                      .join(', ')}{' '}
                    ·{' '}
                    {
                      difficultyOptions.find(
                        (option) => option.value === session.difficulty,
                      )?.label
                    }
                  </p>
                  <StatisticsTotals
                    totals={session}
                    label={`Session statistics for ${sessionDate.format(new Date(session.startedAt))}`}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>
        <div className="statistics-footer">
          <button
            ref={resetButton}
            className="button-link result-wrong"
            disabled={
              history.sessions.length === 0 && history.attempts.length === 0
            }
            onClick={() => {
              setResetError(null);
              setConfirmReset(true);
            }}
          >
            Reset Statistics
          </button>
          <Link className="back-link" to="/">
            Return Home
          </Link>
        </div>
        {resetError && <p role="alert">{resetError}</p>}
      </div>
      {confirmReset && (
        <ConfirmationDialog
          idPrefix="reset-statistics"
          title="Reset statistics?"
          description="Are you sure you want to erase all practice history, saved mistakes and statistics? This cannot be undone. Any current session will be discarded. Your settings will stay the same."
          cancelLabel="Keep history"
          confirmLabel="Erase practice history"
          onCancel={() => setConfirmReset(false)}
          onConfirm={confirm}
        />
      )}
    </PageContainer>
  );
}
