import { Link, Navigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { usePracticeSession } from '../hooks/usePracticeSession';

export default function SessionSummaryPage() {
  const { state } = usePracticeSession();
  if (!state) return <Navigate to="/practice/setup" replace />;
  if (state.isActive) return <Navigate to="/practice/session" replace />;
  return (
    <PageContainer title="Session complete" eyebrow="Small steps count">
      <p className="intro">Nice practice! Here’s how this session added up.</p>
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
      <p className="field-hint">
        Your results stay here while this app is open. Saving progress is coming
        soon.
      </p>
      <Link className="button-link" to="/practice/setup">
        Choose more practice
      </Link>
      <Link className="back-link" to="/">
        Return Home
      </Link>
    </PageContainer>
  );
}
