import type { DifficultyLevel } from '../../types/question';
import { difficultyOptions } from '../../utils/practiceOptions';

interface DifficultySelectorProps {
  value: DifficultyLevel;
  onChange: (value: DifficultyLevel) => void;
}

export default function DifficultySelector({
  value,
  onChange,
}: DifficultySelectorProps) {
  return (
    <fieldset className="setup-section">
      <legend>2. Choose your challenge</legend>
      <div className="option-grid">
        {difficultyOptions.map((option) => (
          <label className="choice-option" key={option.value}>
            <input
              type="radio"
              name="difficulty"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              value={option.value}
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
