import type { SessionLength } from '../../types/session';
import { sessionLengthOptions } from '../../utils/practiceOptions';

interface SessionLengthSelectorProps {
  value: SessionLength;
  onChange: (value: SessionLength) => void;
}

export default function SessionLengthSelector({
  value,
  onChange,
}: SessionLengthSelectorProps) {
  return (
    <fieldset className="setup-section">
      <legend>3. How much practice today?</legend>
      <div className="option-grid">
        {sessionLengthOptions.map((option) => (
          <label className="choice-option" key={option.value}>
            <input
              type="radio"
              name="session-length"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <span className="choice-label">{option.label}</span>
              <span className="choice-description">{option.description}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
