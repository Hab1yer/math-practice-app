import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { usePracticeSession } from '../hooks/usePracticeSession';

export default function HomePage() {
  const { state } = usePracticeSession();
  return (
    <PageContainer
      eyebrow="A little practice. A world of possibility."
      title="Let’s make math click."
    >
      {state?.isActive && (
        <p className="resume-notice">
          <Link to="/practice/session">Resume your saved session →</Link>
        </p>
      )}
      <div className="home-content">
        <div className="welcome-copy">
          <p className="intro">
            Hello, curious mind! Take a small step, try something new, and watch
            your confidence grow.
          </p>
          <div className="math-marks" aria-hidden="true">
            <span>+</span>
            <span>−</span>
            <span>×</span>
            <span>÷</span>
          </div>
          <p className="encouragement">
            Every great discovery starts with a little practice.
          </p>
        </div>
        <section className="home-actions" aria-label="Choose your next step">
          <Link className="action-card action-primary" to="/practice/setup">
            <span className="action-number" aria-hidden="true">
              01
            </span>
            <span>
              <strong>Start Practice</strong>
              <small>A little math, a little discovery.</small>
            </span>
            <span className="action-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
          <Link className="action-card" to="/statistics">
            <span className="action-number" aria-hidden="true">
              02
            </span>
            <span>
              <strong>View Statistics</strong>
              <small>See how your practice adds up.</small>
            </span>
            <span className="action-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
          <Link className="action-card" to="/settings">
            <span className="action-number" aria-hidden="true">
              03
            </span>
            <span>
              <strong>Settings</strong>
              <small>Make this space your own.</small>
            </span>
            <span className="action-arrow" aria-hidden="true">
              ↗
            </span>
          </Link>
        </section>
      </div>
    </PageContainer>
  );
}
