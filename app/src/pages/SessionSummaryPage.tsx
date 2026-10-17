import { Link, Navigate, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { difficultyOptions, operationOptions } from '../utils/practiceOptions';

export default function SessionSummaryPage() {
  const { state, startSession, error } = usePracticeSession();
  const navigate = useNavigate();
  if (!state) return <Navigate to="/practice/setup" replace />;
  if (state.isActive) return <Navigate to="/practice/session" replace />;
  const { session, attempts } = state;
  const accuracy = session.attempted
    ? Math.round((session.correct / session.attempted) * 100)
    : 0;
  const reviewCount = attempts.filter(
    (attempt) => attempt.source === 'mistake-review',
  ).length;
  function practiceAgain() {
    if (
      startSession({
        operations: [...session.operations],
        difficulty: session.difficulty,
        sessionLength: session.sessionLength,
        mode: 'regular',
      })
    )
      navigate('/practice/session');
  }
  return (
    <PageContainer title="Session complete" eyebrow="Small steps count">
      <p className="intro">Nice practice! Here’s how this session added up.</p>
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
          <dt>Review questions completed</dt>
          <dd>{reviewCount}</dd>
        </div>
      </dl>
      {error && <p role="alert">{error}</p>}
      <div className="summary-actions" aria-label="Next practice actions">
        <button className="button-link" onClick={practiceAgain}>
          Practice Again <span aria-hidden="true">→</span>
        </button>
        <button
          className="button-link button-secondary"
          disabled
          aria-describedby="summary-review-hint"
        >
          Practice Mistakes
        </button>
        <Link className="button-link button-secondary" to="/practice/setup">
          Change Settings
        </Link>
        <Link className="button-link button-secondary" to="/statistics">
          View Statistics
        </Link>
      </div>
      <p id="summary-review-hint" className="field-hint">
        Mistake review is coming soon. You can practice again or choose a new
        challenge.
      </p>
      <p className="field-hint">
        Your results stay here while this app is open. Saving progress is coming
        soon.
      </p>
      <Link className="back-link" to="/">
        Return Home
      </Link>
    </PageContainer>
  );
}
