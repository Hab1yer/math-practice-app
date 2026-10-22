import { useContext, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import OperationSelector from '../components/practice/OperationSelector';
import DifficultySelector from '../components/practice/DifficultySelector';
import SessionLengthSelector from '../components/practice/SessionLengthSelector';
import { usePracticeConfiguration } from '../hooks/usePracticeConfiguration';
import type { PracticeConfiguration } from '../types/session';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { useAppPreferences } from '../hooks/useAppPreferences';
import { PracticeHistoryContext } from '../app/practiceHistoryContext';
import { eligibleMistakes } from '../services/mistakeReview';

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
  const location = useLocation();
  const history = useContext(PracticeHistoryContext);
  const active = (history.mistakePatterns ?? []).filter(
    (pattern) => !pattern.mastered,
  );
  const matching = eligibleMistakes(active, draft);
  const unavailable =
    !draft.operations.length ||
    (draft.mode === 'mistake-review' && !matching.length);

  function startSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unavailable) return;
    if (!beginSession(draft)) return;
    setConfiguration(draft);
    navigate('/practice/session');
  }

  return (
    <PageContainer title="Choose your practice">
      {location.state?.missingSession && (
        <p className="field-hint">
          No unfinished session was found. Choose your practice to begin.
        </p>
      )}
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
            <label
              className={`choice-option${active.length ? '' : ' choice-unavailable'}`}
            >
              <input
                type="radio"
                name="practice-mode"
                value="mistake-review"
                disabled={!active.length}
                checked={draft.mode === 'mistake-review'}
                onChange={() => setDraft({ ...draft, mode: 'mistake-review' })}
                aria-describedby="review-hint"
              />
              <span className="choice-label">Practice previous mistakes</span>
            </label>
          </div>
          <p id="review-hint" className="field-hint" role="status">
            {active.length === 0
              ? 'No active mistakes to review. Mark an answer wrong in regular practice to save one.'
              : `${active.length} active mistake ${active.length === 1 ? 'pattern' : 'patterns'} · ${matching.length} match your operations and difficulty.`}
            {draft.mode === 'mistake-review' &&
              active.length > 0 &&
              (matching.length === 0
                ? ' Choose another operation or difficulty, or use regular practice.'
                : ' Related questions use these operations and difficulty. Review ends when these patterns are mastered.')}
          </p>
        </fieldset>
        <div className="setup-footer">
          <button
            className="button-link"
            type="submit"
            disabled={unavailable}
            aria-describedby={
              draft.operations.length === 0
                ? 'operations-validation'
                : draft.mode === 'mistake-review'
                  ? 'review-hint'
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
