import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useContext } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { difficultyOptions, operationOptions } from '../utils/practiceOptions';
import { PracticeHistoryContext } from '../app/practiceHistoryContext';
import { usePracticeConfiguration } from '../hooks/usePracticeConfiguration';
import { eligibleMistakes } from '../services/mistakeReview';

export default function SessionSummaryPage() {
  const { state: currentState, startSession, error } = usePracticeSession();
  const { setConfiguration } = usePracticeConfiguration();
  const history = useContext(PracticeHistoryContext);
  const latestCompleted = history.sessions
    .filter((session) => session.completedAt)
    .sort((a, b) => b.completedAt!.localeCompare(a.completedAt!))[0];
  // Restore completed recaps only; active-card recovery belongs to Phase 18.
  const state =
    currentState ??
    (latestCompleted
      ? {
          session: latestCompleted,
          attempts: history.attempts.filter(
            (attempt) => attempt.sessionId === latestCompleted.id,
          ),
          currentQuestion: null,
          currentQuestionIndex: latestCompleted.attempted,
          isActive: false,
        }
      : null);
  const navigate = useNavigate();
  if (!state) return <Navigate to="/practice/setup" replace />;
  if (state.isActive) return <Navigate to="/practice/session" replace />;
  const { session, attempts } = state;
  const active = (history.mistakePatterns ?? []).filter(
    (pattern) => !pattern.mastered,
  );
  const configuration = {
    operations: [...session.operations],
    difficulty: session.difficulty,
    sessionLength: session.sessionLength,
    mode: session.mode ?? 'regular',
  };
  const accuracy = session.attempted
    ? Math.round((session.correct / session.attempted) * 100)
    : 0;
  const reviewCount = attempts.filter(
    (attempt) => attempt.source === 'mistake-review',
  ).length;
  function practiceAgain() {
    if (startSession(configuration)) {
      setConfiguration(configuration);
      navigate('/practice/session');
    }
  }
  function practiceMistakes() {
    if (!active.length) return;
    setConfiguration({
      ...configuration,
      mode: 'mistake-review',
      difficulty: active[0].difficulty,
      operations: operationOptions.map((option) => option.value),
    });
    navigate('/practice/setup');
  }
  return (
    <PageContainer title="Session complete" eyebrow="Small steps count">
      <p className="intro">Nice practice! Here’s how this session added up.</p>
      {session.completionReason === 'mastered' && (
        <p className="review-complete" role="status">
          All mistakes matching this session are mastered.
        </p>
      )}
      <div className="summary-accuracy">
        <p className="eyebrow">Your accuracy</p>
        <p className="accuracy-value">{accuracy}%</p>
        <p>
          {session.attempted === 0
            ? 'No answers recorded yet. A fresh start is always welcome.'
            : `${session.correct} of ${session.attempted} answers marked right. Keep exploring!`}
        </p>
      </div>
      <dl className="session-totals" aria-label="Session totals">
        <div>
          <dt>Attempted</dt>
          <dd>{state.session.attempted}</dd>
        </div>
        <div>
          <dt>Correct</dt>
          <dd>{state.session.correct}</dd>
        </div>
        <div>
          <dt>Incorrect</dt>
          <dd>{state.session.incorrect}</dd>
        </div>
      </dl>
      <dl className="configuration-summary" aria-label="Practice details">
        <div>
          <dt>Operations</dt>
          <dd>
            {operationOptions
              .filter((option) => session.operations.includes(option.value))
              .map((option) => option.label)
              .join(', ')}
          </dd>
        </div>
        <div>
          <dt>Difficulty</dt>
          <dd>
            {
              difficultyOptions.find(
                (option) => option.value === session.difficulty,
              )?.label
            }
          </dd>
        </div>
        <div>
          <dt>Mode</dt>
          <dd>
            {session.mode === 'mistake-review'
              ? 'Mistake review'
              : 'Regular practice'}
          </dd>
        </div>
        <div>
          <dt>Review questions completed</dt>
          <dd>{reviewCount}</dd>
        </div>
      </dl>
      {error && <p role="alert">{error}</p>}
      <div className="summary-actions" aria-label="Next practice actions">
        <button
          className="button-link"
          onClick={practiceAgain}
          disabled={
            configuration.mode === 'mistake-review' &&
            !eligibleMistakes(active, configuration).length
          }
          aria-describedby={
            configuration.mode === 'mistake-review'
              ? 'summary-review-hint'
              : undefined
          }
        >
          Practice Again <span aria-hidden="true">→</span>
        </button>
        <button
          className="button-link button-secondary"
          disabled={!active.length}
          onClick={practiceMistakes}
          aria-describedby="summary-review-hint"
        >
          Practice Mistakes
        </button>
        <Link
          className="button-link button-secondary"
          to="/practice/setup"
          onClick={() => setConfiguration(configuration)}
        >
          Change Settings
        </Link>
        <Link className="button-link button-secondary" to="/statistics">
          View Statistics
        </Link>
      </div>
      <p id="summary-review-hint" className="field-hint">
        {active.length
          ? `${active.length} active mistake ${active.length === 1 ? 'pattern' : 'patterns'} to review.`
          : 'No active mistakes to review.'}
        {active.length > 0 &&
        configuration.mode === 'mistake-review' &&
        !eligibleMistakes(active, configuration).length
          ? ' None match this session. Choose Practice Mistakes to review another level.'
          : ''}
      </p>
      <p className="field-hint">
        Your results are saved in this browser on this device when storage is
        available.
      </p>
      <Link className="back-link" to="/">
        Return Home
      </Link>
    </PageContainer>
  );
}
