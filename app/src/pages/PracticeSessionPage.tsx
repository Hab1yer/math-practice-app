import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import QuestionCard from '../components/practice/QuestionCard';
import EndSessionDialog from '../components/practice/EndSessionDialog';
import { usePracticeSession } from '../hooks/usePracticeSession';
import { useAppPreferences } from '../hooks/useAppPreferences';
import { difficultyOptions, operationOptions } from '../utils/practiceOptions';

export default function PracticeSessionPage() {
  const { state, recordResult, endSession, error } = usePracticeSession();
  const { preferences } = useAppPreferences();
  const [confirmEnd, setConfirmEnd] = useState(false);
  const endButton = useRef<HTMLButtonElement>(null);
  const dialogWasOpen = useRef(false);
  useEffect(() => {
    if (dialogWasOpen.current && !confirmEnd) endButton.current?.focus();
    dialogWasOpen.current = confirmEnd;
  }, [confirmEnd]);
  if (!state) return <Navigate to="/practice/setup" replace />;
  if (!state.isActive) return <Navigate to="/practice/summary" replace />;
  const { session, currentQuestion, currentQuestionIndex } = state;
  function cancelEnd() {
    setConfirmEnd(false);
  }
  return (
    <PageContainer
      eyebrow="One small step at a time"
      title="Your practice space"
    >
      <div className="practice-session" inert={confirmEnd}>
        <p className="intro">
          Take your time. Each question is a chance to learn.
        </p>
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
        <p className="field-hint">
          Finished answers are saved on this device when storage is available.
          Refreshing starts a new session.
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
            onResult={(selfReportedCorrect, selectedAnswer) =>
              recordResult({
                questionId: currentQuestion.id,
                selectedAnswer,
                selfReportedCorrect,
              })
            }
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
        <EndSessionDialog onCancel={cancelEnd} onConfirm={endSession} />
      )}
    </PageContainer>
  );
}
