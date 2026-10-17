import type { MathOperation } from '../../types/question';
import { operationOptions } from '../../utils/practiceOptions';

interface OperationSelectorProps {
  value: MathOperation[];
  onChange: (value: MathOperation[]) => void;
}

export default function OperationSelector({
  value,
  onChange,
}: OperationSelectorProps) {
  function toggle(operation: MathOperation) {
    onChange(
      value.includes(operation)
        ? value.filter((item) => item !== operation)
        : [...value, operation],
    );
  }

  return (
    <fieldset
      className="setup-section"
      aria-describedby="operations-hint operations-validation"
    >
      <legend>1. What would you like to practice?</legend>
      <div className="section-intro">
        <p id="operations-hint">Pick one or mix a few together.</p>
        <button
          className="text-button"
          type="button"
          onClick={() =>
            onChange(operationOptions.map((option) => option.value))
          }
        >
          Select all operations
        </button>
      </div>
      <div className="option-grid operation-grid">
        {operationOptions.map((option) => (
          <label className="choice-option" key={option.value}>
            <input
              type="checkbox"
              name="operations"
              value={option.value}
              checked={value.includes(option.value)}
              onChange={() => toggle(option.value)}
            />
            <span className="operation-symbol" aria-hidden="true">
              {option.symbol}
            </span>
            <span className="choice-label">{option.label}</span>
          </label>
        ))}
      </div>
      <p
        className="validation-message"
        id="operations-validation"
        aria-live="polite"
      >
        {value.length === 0
          ? 'Choose at least one operation to start your session.'
          : ''}
      </p>
    </fieldset>
  );
}
