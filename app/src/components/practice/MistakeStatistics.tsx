import { useId, useMemo } from 'react';
import type { MistakePattern } from '../../types/mistake';
import type { PracticeHistory } from '../../services/storageValidation';
import { calculateMistakeStatistics } from '../../services/mistakeStatistics';
import { arithmeticSymbols } from '../../services/difficultyRules';
import {
  operationOptions,
  difficultyOptions,
} from '../../utils/practiceOptions';
import { spokenProblem } from '../../utils/explanations';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

function PatternDetails({
  pattern,
  threshold,
}: {
  pattern: MistakePattern;
  threshold: number;
}) {
  const progressId = useId();
  return (
    <li className="mistake-pattern">
      <div className="mistake-fact">
        <h4
          aria-label={`${spokenProblem(pattern)} equals ${pattern.correctAnswer}`}
        >
          {pattern.firstOperand} {arithmeticSymbols[pattern.operation]}{' '}
          {pattern.secondOperand} = {pattern.correctAnswer}
        </h4>
        <span>
          {
            difficultyOptions.find(
              (option) => option.value === pattern.difficulty,
            )?.label
          }
        </span>
      </div>
      <p>
        Missed {pattern.incorrectCount}{' '}
        {pattern.incorrectCount === 1 ? 'time' : 'times'} · Last missed{' '}
        <time dateTime={pattern.lastIncorrectAt}>
          {dateFormat.format(new Date(pattern.lastIncorrectAt))}
        </time>
      </p>
      <div className="mastery-progress">
        <label htmlFor={progressId}>
          {pattern.mastered ? '✓ Mastered' : 'Review progress'} ·{' '}
          {pattern.similarCorrectCount} of {threshold} correct since last miss
        </label>
        <progress
          id={progressId}
          max={threshold}
          value={Math.min(threshold, pattern.similarCorrectCount)}
        />
      </div>
    </li>
  );
}

export default function MistakeStatistics({
  history,
  threshold,
}: {
  history: PracticeHistory;
  threshold: number;
}) {
  const stats = useMemo(
    () =>
      calculateMistakeStatistics(
        history.mistakePatterns ?? [],
        history.attempts,
      ),
    [history.mistakePatterns, history.attempts],
  );
  return (
    <section
      className="statistics-section mistake-statistics"
      aria-labelledby="mistake-stats-title"
    >
      <h2 id="mistake-stats-title">Mistakes &amp; review</h2>
      <dl
        className="statistics-totals statistics-overview"
        aria-label="Mistake review statistics"
      >
        {[
          ['Active patterns', stats.active.length],
          ['Mastered patterns', stats.mastered.length],
          ['Review questions practiced', stats.reviewAttempted],
          ['Review answers correct', stats.reviewCorrect],
        ].map(([label, count]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
      {stats.mostMissedOperations.length > 0 && (
        <p className="field-hint">
          Most missed{' '}
          {stats.mostMissedOperations.length === 1
            ? 'operation'
            : 'operations (tied)'}
          :{' '}
          {stats.mostMissedOperations
            .map(
              (operation) =>
                operationOptions.find((option) => option.value === operation)!
                  .label,
            )
            .join(', ')}{' '}
          · {stats.mostMissedCount}{' '}
          {stats.mostMissedCount === 1 ? 'miss' : 'misses'}
          {stats.mostMissedOperations.length > 1 ? ' each' : ''}.
        </p>
      )}
      {!stats.active.length && !stats.mastered.length ? (
        <p>No mistake patterns yet. Answers you mark wrong will appear here.</p>
      ) : (
        <>
          <h3>To review ({stats.active.length})</h3>
          <p className="field-hint">
            Most missed facts first; ties show the most recent miss first.
          </p>
          {stats.active.length ? (
            <ol className="mistake-list">
              {stats.active.map((pattern) => (
                <PatternDetails
                  key={pattern.id}
                  pattern={pattern}
                  threshold={threshold}
                />
              ))}
            </ol>
          ) : (
            <p>No active mistakes. All saved patterns are mastered.</p>
          )}
          <details className="mastered-patterns">
            <summary>Mastered ({stats.mastered.length})</summary>
            {stats.mastered.length ? (
              <ol className="mistake-list">
                {stats.mastered.map((pattern) => (
                  <PatternDetails
                    key={pattern.id}
                    pattern={pattern}
                    threshold={threshold}
                  />
                ))}
              </ol>
            ) : (
              <p>No mastered patterns yet.</p>
            )}
          </details>
        </>
      )}
    </section>
  );
}
