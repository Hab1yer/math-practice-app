import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import OperationSelector from '../components/practice/OperationSelector';
import DifficultySelector from '../components/practice/DifficultySelector';
import SessionLengthSelector from '../components/practice/SessionLengthSelector';
import { usePracticeConfiguration } from '../hooks/usePracticeConfiguration';
import type { PracticeConfiguration } from '../types/session';

export default function PracticeSetupPage() {
  const { configuration, setConfiguration } = usePracticeConfiguration();
  const [draft, setDraft] = useState<PracticeConfiguration>(
    configuration ?? {
      operations: ['addition'],
      difficulty: 1,
      sessionLength: 10,
      mode: 'regular',
    },
  );
  const navigate = useNavigate();

  function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.operations.length) return;
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
            No mistakes to review yet. Start with a regular practice preview.
          </p>
        </fieldset>
        <div className="setup-footer">
          <p className="field-hint">
            Try a one-card preview. Full practice sessions are coming soon.
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
