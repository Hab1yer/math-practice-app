import { useEffect, useId, useRef, useState } from 'react';
import type { Question } from '../../types/question';
import AnswerChoice from './AnswerChoice';
import { explainQuestion, spokenProblem } from '../../utils/explanations';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number | 'continuous';
  onResult: (selfReportedCorrect: boolean, selectedAnswer: number) => void;
  animationEnabled?: boolean;
  showExplanations?: boolean;
  initialSelectedAnswer?: number;
  initiallyFlipped?: boolean;
  onInteraction?: (selectedAnswer: number, flipped: boolean) => void;
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
  initialSelectedAnswer,
  initiallyFlipped = false,
  onInteraction,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(
    initialSelectedAnswer ?? null,
  );
  const [isCardFlipped, setIsCardFlipped] = useState(initiallyFlipped);
  const [result, setResult] = useState<boolean | null>(null);
  const submitted = useRef(false);
  const answerHeading = useRef<HTMLHeadingElement>(null);
  const problemHeading = useRef<HTMLHeadingElement>(null);
  const resultMessage = useRef<HTMLParagraphElement>(null);
  const speech = spokenProblem(question);
  const progressId = useId();
  const reducedMotion = useReducedMotion();
  const cardRegion = useRef<HTMLElement>(null);
  useEffect(() => {
    function selectWithNumber(event: KeyboardEvent) {
      if (
        event.defaultPrevented ||
        event.repeat ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.isComposing ||
        isCardFlipped ||
        submitted.current ||
        cardRegion.current?.closest('[inert]') ||
        !/^[1-4]$/.test(event.key)
      )
        return;
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="combobox"], [role="spinbutton"], [role="dialog"], [role="alertdialog"], dialog',
        )
      )
        return;
      const choice = question.choices[Number(event.key) - 1];
      if (choice === undefined) return;
      event.preventDefault();
      setSelectedAnswer(choice);
      onInteraction?.(choice, false);
    }
    document.addEventListener('keydown', selectWithNumber);
    return () => document.removeEventListener('keydown', selectWithNumber);
  }, [isCardFlipped, question.choices, onInteraction]);

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
    onResult(correct, selectedAnswer);
  }

  return (
    <section
      ref={cardRegion}
      className="question-card"
      aria-label="Math question card"
      data-flipped={isCardFlipped}
      data-animate={animationEnabled && !reducedMotion}
    >
      <p className="card-progress" id={progressId}>
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
            aria-describedby={progressId}
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
                  if (!isCardFlipped) {
                    setSelectedAnswer(choice);
                    onInteraction?.(choice, false);
                  }
                }}
              />
            ))}
          </div>
          <p className="field-hint">
            {selectedAnswer === null
              ? 'Choose an answer, then flip to check.'
              : 'You can change your answer before flipping.'}
          </p>
          <p className="keyboard-hint">Use keys 1–4 to choose an answer.</p>
          <p
            className="sr-only"
            role="status"
            aria-label="Answer selection"
            aria-live="polite"
            aria-atomic="true"
          >
            {selectedAnswer === null
              ? ''
              : `Selected answer: ${selectedAnswer}`}
          </p>
          <button
            type="button"
            className="button-link flip-button"
            disabled={selectedAnswer === null || isCardFlipped}
            aria-expanded={isCardFlipped}
            onClick={() => {
              if (selectedAnswer !== null) {
                setIsCardFlipped(true);
                onInteraction?.(selectedAnswer, true);
              }
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
            aria-describedby={progressId}
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
        aria-label="Card result"
      >
        {result === null
          ? ''
          : `You marked this card as ${result ? 'correct' : 'incorrect'}. Keep exploring!`}
      </p>
    </section>
  );
}
