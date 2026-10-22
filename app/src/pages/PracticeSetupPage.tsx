import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import OperationSelector from '../components/practice/OperationSelector';
import DifficultySelector from '../components/practice/DifficultySelector';
import SessionLengthSelector from '../components/practice/SessionLengthSelector';
import { usePracticeConfiguration } from '../hooks/usePracticeConfiguration';
import type { PracticeConfiguration } from '../types/session';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { useAppPreferences } from '../hooks/useAppPreferences';

export default function PracticeSetupPage() {
  const { configuration, setConfiguration } = usePracticeConfiguration();
  const { startSession: beginSession, error } = usePracticeSession();
  const { preferences } = useAppPreferences();
  const [draft, setDraft] = useState<PracticeConfiguration>(
    configuration ?? {
      operations: [...preferences.defaultOperations],
      difficulty: preferences.defaultDifficulty,
      sessionLength: preferences.defaultSessionLength,
      mode: 'regular',
    },
  );
  const navigate = useNavigate();

  function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.operations.length) return;
    if (!beginSession(draft)) return;
    setConfiguration(draft);
    navigate('/practice/session');
  }

  return (
    <PageContainer
      eyebrow="Make room for a little discovery"
      title="Choose your practice"
    >
      <p className="intro">
        A quick warm-up or a bigger challenge? Make it yours.
      </p>
      <form className="setup-form" onSubmit={startSession}>
        {error && <p role="alert">{error}</p>}
        <OperationSelector
          value={draft.operations}
          onChange={(operations) => setDraft({ ...draft, operations })}
        />
        <DifficultySelector
          value={draft.difficulty}
          onChange={(difficulty) => setDraft({ ...draft, difficulty })}
        />
        <SessionLengthSelector
          value={draft.sessionLength}
          onChange={(sessionLength) => setDraft({ ...draft, sessionLength })}
        />
        <fieldset className="setup-section" aria-describedby="review-hint">
          <legend>4. Pick a practice mode</legend>
          <div className="option-grid">
            <label className="choice-option">
              <input
                type="radio"
                name="practice-mode"
                value="regular"
                checked={draft.mode === 'regular'}
                onChange={() => setDraft({ ...draft, mode: 'regular' })}
              />
              <span className="choice-label">Regular practice</span>
            </label>
            <label className="choice-option choice-unavailable">
              <input
                type="radio"
                name="practice-mode"
                value="mistake-review"
                disabled
                aria-describedby="review-hint"
              />
              <span className="choice-label">Practice previous mistakes</span>
            </label>
          </div>
          <p id="review-hint" className="field-hint">
            Mistake review is coming soon. Start with regular practice.
          </p>
        </fieldset>
        <div className="setup-footer">
          <p className="field-hint">
            Ready for a little discovery? Let’s get started.
          </p>
          <button
            className="button-link"
            type="submit"
            disabled={draft.operations.length === 0}
            aria-describedby={
              draft.operations.length === 0
                ? 'operations-validation'
                : undefined
            }
          >
            Start Session <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>
      <Link className="back-link" to="/">
        Return Home
      </Link>
    </PageContainer>
  );
}
