interface AnswerChoiceProps {
  value: number;
  position: number;
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
}

export default function AnswerChoice({
  value,
  position,
  selected,
  locked,
  onSelect,
}: AnswerChoiceProps) {
  return (
    <button
      type="button"
      className="answer-choice"
      aria-label={`Answer ${position}: ${value}`}
      aria-pressed={selected}
      disabled={locked}
      onClick={onSelect}
    >
      <span>{value}</span>
      <small className="answer-key" aria-hidden="true">
        {position}
      </small>
      {selected && <small aria-hidden="true">✓ Selected</small>}
    </button>
  );
}
