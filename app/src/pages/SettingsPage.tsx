import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { useAppPreferences } from '../hooks/useAppPreferences';

export default function SettingsPage() {
  const { preferences, updatePreferences } = useAppPreferences();
  return (
    <PageContainer
      eyebrow="A space that feels like you"
      title="Make it your own"
    >
      <p className="intro">Choose how your question cards feel.</p>
      <div className="preferences">
        <label className="choice-option">
          <input
            type="checkbox"
            checked={preferences.cardAnimationEnabled}
            onChange={(event) =>
              updatePreferences({ cardAnimationEnabled: event.target.checked })
            }
          />
          <span>
            <span className="choice-label">Card animations</span>
            <span className="choice-description">
              Turn off the flip motion. Your device’s reduced-motion preference
              is always respected.
            </span>
          </span>
        </label>
        <label className="choice-option">
          <input
            type="checkbox"
            checked={preferences.showExplanations}
            onChange={(event) =>
              updatePreferences({ showExplanations: event.target.checked })
            }
          />
          <span>
            <span className="choice-label">Show explanations</span>
            <span className="choice-description">
              Show a little explanation when you reveal an answer.
            </span>
          </span>
        </label>
      </div>
      <p className="field-hint">
        These choices are saved in this browser when storage is available.
      </p>
      <Link className="button-link" to="/practice/session">
        Back to practice <span aria-hidden="true">→</span>
      </Link>
      <Link className="back-link" to="/">
        Return Home
      </Link>
    </PageContainer>
  );
}
