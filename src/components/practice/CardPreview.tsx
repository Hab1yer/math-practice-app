import { useState } from 'react';
import type { PracticeConfiguration } from '../../types/session';
import { generateQuestion } from '../../services/questionGenerator';
import { useAppPreferences } from '../../hooks/useAppPreferences';
import QuestionCard from './QuestionCard';

export default function CardPreview({
  configuration,
}: {
  configuration: PracticeConfiguration;
}) {
  const { preferences } = useAppPreferences();
  const [question, setQuestion] = useState(() =>
    generateQuestion(configuration.operations, configuration.difficulty),
  );
  const [reported, setReported] = useState(false);
  function tryAnother() {
    setQuestion(
      generateQuestion(configuration.operations, configuration.difficulty),
    );
    setReported(false);
  }
  return (
    <div className="card-preview">
      <p className="status-label">One-card preview</p>
      <p className="field-hint">
        Try one card with your choices. Full sessions and saved progress are
        coming soon.
      </p>
      <QuestionCard
        question={question}
        questionNumber={1}
        totalQuestions={1}
        animationEnabled={preferences.cardAnimationEnabled}
        showExplanations={preferences.showExplanations}
        onResult={() => setReported(true)}
      />
      {reported && (
        <div className="preview-next">
          <p>This preview isn’t saved. Ready for another small step?</p>
          <button className="button-link" type="button" onClick={tryAnother}>
            Try another card
          </button>
        </div>
      )}
    </div>
  );
}
