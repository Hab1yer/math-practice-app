import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import QuestionCard from '../components/practice/QuestionCard';
import EndSessionDialog from '../components/practice/EndSessionDialog';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { useAppPreferences } from '../hooks/useAppPreferences';
import { difficultyOptions, operationOptions } from '../utils/practiceOptions';
import { playAnswerSound } from '../services/soundService';

export default function PracticeSessionPage() {
  const { state, recordResult, endSession, error, updateCard } =
    usePracticeSession();
  const { preferences } = useAppPreferences();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const endButton = useRef<HTMLButtonElement>(null);
  const dialogWasOpen = useRef(false);
  const [enteredActive] = useState(() => state?.isActive ?? false);
  const navigate = useNavigate();
  useEffect(() => {
    if (dialogWasOpen.current && !confirmEnd) endButton.current?.focus();
    dialogWasOpen.current = confirmEnd;
  }, [confirmEnd]);
  if (!state)
    return (
      <Navigate to="/practice/setup" replace state={{ missingSession: true }} />
    );
  if (!state.isActive)
    return enteredActive ? null : <Navigate to="/practice/summary" replace />;
  const { session, currentQuestion, currentQuestionIndex } = state;
  function cancelEnd() {
    setConfirmEnd(false);
  }
  return (
    <PageContainer
      title={
        session.mode === 'mistake-review'
          ? 'Mistake review'
          : 'Your practice space'
      }
      focusHeading={!currentQuestion}
    >
      <div className="practice-session" inert={confirmEnd}>
        <p className="session-context">
          {operationOptions
            .filter((option) => session.operations.includes(option.value))
            .map((option) => option.label)
            .join(', ')}{' '}
          ·{' '}
          {
            difficultyOptions.find(
              (option) => option.value === session.difficulty,
            )?.label
          }
        </p>
        {preferences.feedbackEffectsEnabled && state.feedback && (
          <p
            className="practice-feedback"
            role="status"
            aria-label="Practice feedback"
          >
            {state.feedback}
          </p>
        )}
        <p
          className="sr-only"
          role="status"
          aria-label="Session progress"
          aria-live="polite"
          aria-atomic="true"
        >
          {session.attempted} answers completed. {session.correct} marked right
          and {session.incorrect} marked wrong.
        </p>
        <p className="field-hint">
          Finished answers are saved on this device when storage is available.
          You can refresh and return to this card.
        </p>
        <dl className="session-totals" aria-label="Current session totals">
          <div>
            <dt>Attempted</dt>
            <dd>{session.attempted}</dd>
          </div>
          <div>
            <dt>Correct</dt>
            <dd>{session.correct}</dd>
          </div>
          <div>
            <dt>Incorrect</dt>
            <dd>{session.incorrect}</dd>
          </div>
        </dl>
        {session.sessionLength !== 'continuous' && (
          <div className="session-progress">
            <label htmlFor="session-progress">
              {session.attempted} of {session.sessionLength} completed
            </label>
            <progress
              id="session-progress"
              max={session.sessionLength}
              value={session.attempted}
            />
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        {currentQuestion ? (
          <QuestionCard
            question={currentQuestion}
            questionNumber={currentQuestionIndex + 1}
            totalQuestions={session.sessionLength}
            animationEnabled={preferences.cardAnimationEnabled}
            showExplanations={preferences.showExplanations}
            initialSelectedAnswer={state.selectedAnswer}
            initiallyFlipped={state.isCardFlipped}
            onInteraction={(selectedAnswer, flipped) =>
              updateCard?.(currentQuestion.id, selectedAnswer, flipped)
            }
            onResult={(selfReportedCorrect, selectedAnswer) => {
              if (preferences.soundEnabled)
                playAnswerSound(selfReportedCorrect);
              const next = recordResult({
                questionId: currentQuestion.id,
                selectedAnswer,
                selfReportedCorrect,
              });
              if (next && !next.isActive)
                navigate('/practice/summary', { replace: true });
            }}
          />
        ) : (
          <p role="alert">
            We couldn’t prepare the next question. Your answered questions are
            included; end this session to see your recap.
          </p>
        )}
        <button
          ref={endButton}
          type="button"
          className="button-link result-wrong end-session"
          onClick={() => setConfirmEnd(true)}
        >
          End Session
        </button>
      </div>
      {confirmEnd && (
        <EndSessionDialog
          onCancel={cancelEnd}
          onConfirm={() => {
            endSession();
            navigate('/practice/summary', { replace: true });
          }}
        />
      )}
    </PageContainer>
  );
}
