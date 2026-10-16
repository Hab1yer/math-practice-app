import { useEffect, useRef, useState } from 'react';
import type { Question } from '../../types/question';
import AnswerChoice from './AnswerChoice';
import { explainQuestion, spokenProblem } from '../../utils/explanations';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number | 'continuous';
  onResult: (selfReportedCorrect: boolean) => void;
  animationEnabled?: boolean;
  showExplanations?: boolean;
}

export default function QuestionCard(props: QuestionCardProps) {
  return <CardInteraction key={props.question.id} {...props} />;
}

function CardInteraction({
  question,
  questionNumber,
  totalQuestions,
  onResult,
  animationEnabled = true,
  showExplanations = true,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);
  const submitted = useRef(false);
  const answerHeading = useRef<HTMLHeadingElement>(null);
  const problemHeading = useRef<HTMLHeadingElement>(null);
  const resultMessage = useRef<HTMLParagraphElement>(null);
  const speech = spokenProblem(question);

  useEffect(() => {
    (isCardFlipped ? answerHeading : problemHeading).current?.focus();
  }, [isCardFlipped]);

  useEffect(() => {
    if (result !== null) resultMessage.current?.focus();
  }, [result]);

  function reportResult(correct: boolean) {
    if (!isCardFlipped || selectedAnswer === null || submitted.current) return;
    submitted.current = true;
    setResult(correct);
    onResult(correct);
  }

  return (
    <section
      className="question-card"
      aria-label="Math question card"
      data-flipped={isCardFlipped}
      data-animate={animationEnabled}
    >
      <p className="card-progress">
        Question {questionNumber}
        {totalQuestions === 'continuous'
          ? ' · Continuous practice'
          : ` of ${totalQuestions}`}
      </p>
      <div className="card-faces">
        <div
          className="card-face card-front"
          aria-hidden={isCardFlipped}
          inert={isCardFlipped}
        >
          <p className="eyebrow">Take your time. Give it a try.</p>
          <h2
            ref={problemHeading}
            tabIndex={-1}
            className="math-problem"
            aria-label={`${speech} equals what?`}
          >
            {question.displayText}
          </h2>
          <div
            className="answer-grid"
            role="group"
            aria-label="Choose an answer"
          >
            {question.choices.map((choice, index) => (
              <AnswerChoice
                key={choice}
                value={choice}
                position={index + 1}
                selected={selectedAnswer === choice}
                locked={isCardFlipped}
                onSelect={() => {
                  if (!isCardFlipped) setSelectedAnswer(choice);
                }}
              />
            ))}
          </div>
          <p className="field-hint">
            {selectedAnswer === null
              ? 'Choose an answer, then flip to check.'
              : 'You can change your answer before flipping.'}
          </p>
          <button
            type="button"
            className="button-link flip-button"
            disabled={selectedAnswer === null || isCardFlipped}
            aria-expanded={isCardFlipped}
            onClick={() => {
              if (selectedAnswer !== null) setIsCardFlipped(true);
            }}
          >
            Flip Card <span aria-hidden="true">↻</span>
          </button>
        </div>
        <div
          className="card-face card-back"
          aria-hidden={!isCardFlipped}
          inert={!isCardFlipped}
        >
          <p className="eyebrow">Let’s see how it adds up.</p>
          <h2
            ref={answerHeading}
            tabIndex={-1}
            className="math-problem revealed-answer"
            aria-label={`${speech} equals ${question.correctAnswer}`}
          >
            {question.displayText.replace('?', String(question.correctAnswer))}
          </h2>
          <p className="selected-answer">
            Your answer: <strong>{selectedAnswer ?? '—'}</strong>
          </p>
          {showExplanations && (
            <p className="answer-explanation">{explainQuestion(question)}</p>
          )}
          <p className="field-hint">How did you do? You decide.</p>
          <div className="result-actions">
            <button
              type="button"
              className="button-link"
              disabled={result !== null || !isCardFlipped}
              onClick={() => reportResult(true)}
            >
              I Got It Right
            </button>
            <button
              type="button"
              className="button-link result-wrong"
              disabled={result !== null || !isCardFlipped}
              onClick={() => reportResult(false)}
            >
              I Got It Wrong
            </button>
          </div>
        </div>
      </div>
      <p
        ref={resultMessage}
        tabIndex={-1}
        className="card-result"
        role="status"
      >
        {result === null
          ? ''
          : `You marked this card as ${result ? 'correct' : 'incorrect'}. Keep exploring!`}
      </p>
    </section>
  );
}
