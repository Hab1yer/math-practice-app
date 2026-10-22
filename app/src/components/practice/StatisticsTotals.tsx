import type { OperationStatistics } from '../../types/statistics';
import { accuracy } from '../../services/statisticsService';

export default function StatisticsTotals({
  totals,
  label,
  overview = false,
}: {
  totals: OperationStatistics;
  label: string;
  overview?: boolean;
}) {
  return (
    <dl
      className={`statistics-totals${overview ? ' statistics-overview' : ''}`}
      aria-label={label}
    >
      <div>
        <dt>Attempted</dt>
        <dd>{totals.attempted}</dd>
      </div>
      <div>
        <dt>Correct</dt>
        <dd>{totals.correct}</dd>
      </div>
      <div>
        <dt>Incorrect</dt>
        <dd>{totals.incorrect}</dd>
      </div>
      <div className="statistics-accuracy">
        <dt>Accuracy</dt>
        <dd>{accuracy(totals)}%</dd>
      </div>
    </dl>
  );
}
