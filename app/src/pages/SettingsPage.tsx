import { useContext, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import ConfirmationDialog from '../components/layout/ConfirmationDialog';
import { useAppPreferences } from '../hooks/useAppPreferences';
import { PracticeHistoryActionsContext } from '../app/practiceHistoryActionsContext';
import {
  difficultyOptions,
  operationOptions,
  sessionLengthOptions,
} from '../utils/practiceOptions';
import type { AppSettings } from '../types/settings';

export default function SettingsPage() {
  const { preferences, updatePreferences } = useAppPreferences();
  const { clearAllData } = useContext(PracticeHistoryActionsContext);
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearError, setClearError] = useState<string | null>(null);
  const clearButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (wasOpen.current && !confirmClear) clearButton.current?.focus();
    wasOpen.current = confirmClear;
  }, [confirmClear]);
  function confirm() {
    if (clearAllData()) navigate('/');
    else {
      setClearError(
        'Application data could not be fully cleared. Reload before trying again.',
      );
      setConfirmClear(false);
    }
  }
  const toggles: {
    key: 'soundEnabled' | 'cardAnimationEnabled' | 'showExplanations';
    label: string;
    description: string;
  }[] = [
    {
      key: 'soundEnabled',
      label: 'Sound effects',
      description: 'Play a short tone after marking an answer right or wrong.',
    },
    {
      key: 'cardAnimationEnabled',
      label: 'Card animations',
      description:
        'Your device’s reduced-motion preference is always respected.',
    },
    {
      key: 'showExplanations',
      label: 'Show explanations',
      description: 'Show an explanation when you reveal an answer.',
    },
  ];
  return (
    <PageContainer title="Settings">
      <div inert={confirmClear}>
        <p className="field-hint">
          Changes save automatically in this browser when storage is available.
        </p>
        <section
          className="settings-section"
          aria-labelledby="card-settings-title"
        >
          <h2 id="card-settings-title">Question cards</h2>
          <div className="preferences">
            {toggles.map((toggle) => (
              <label className="choice-option" key={toggle.key}>
                <input
                  type="checkbox"
                  checked={preferences[toggle.key]}
                  onChange={(event) =>
                    updatePreferences({ [toggle.key]: event.target.checked })
                  }
                />
                <span>
                  <span className="choice-label">{toggle.label}</span>
                  <span className="choice-description">
                    {toggle.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </section>
        <section
          className="settings-section"
          aria-labelledby="practice-defaults-title"
        >
          <h2 id="practice-defaults-title">Practice defaults</h2>
          <p className="field-hint">
            Used for new practice setups. You can change them for any session.
          </p>
          <fieldset
            className="settings-operations"
            aria-describedby="default-operations-hint"
          >
            <legend>Default operations</legend>
            <div className="option-grid">
              {operationOptions.map((option) => (
                <label className="choice-option" key={option.value}>
                  <input
                    type="checkbox"
                    checked={preferences.defaultOperations.includes(
                      option.value,
                    )}
                    disabled={
                      preferences.defaultOperations.length === 1 &&
                      preferences.defaultOperations[0] === option.value
                    }
                    onChange={(event) =>
                      updatePreferences({
                        defaultOperations: event.target.checked
                          ? [...preferences.defaultOperations, option.value]
                          : preferences.defaultOperations.filter(
                              (operation) => operation !== option.value,
                            ),
                      })
                    }
                  />
                  <span className="choice-label">{option.label}</span>
                </label>
              ))}
            </div>
            <p className="field-hint" id="default-operations-hint">
              Keep at least one operation selected.
            </p>
          </fieldset>
          <div className="settings-selects">
            <label>
              Default difficulty
              <select
                value={preferences.defaultDifficulty}
                onChange={(event) =>
                  updatePreferences({
                    defaultDifficulty: Number(
                      event.target.value,
                    ) as AppSettings['defaultDifficulty'],
                  })
                }
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Default session length
              <select
                value={preferences.defaultSessionLength}
                onChange={(event) =>
                  updatePreferences({
                    defaultSessionLength:
                      event.target.value === 'continuous'
                        ? 'continuous'
                        : (Number(
                            event.target.value,
                          ) as AppSettings['defaultSessionLength']),
                  })
                }
              >
                {sessionLengthOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
        <section
          className="settings-section settings-data"
          aria-labelledby="application-data-title"
        >
          <h2 id="application-data-title">Application data</h2>
          <p>
            Erase settings, practice history, statistics and saved mistakes from
            this browser.
          </p>
          <button
            ref={clearButton}
            className="button-link result-wrong"
            onClick={() => {
              setClearError(null);
              setConfirmClear(true);
            }}
          >
            Clear All Application Data
          </button>
          {clearError && <p role="alert">{clearError}</p>}
        </section>
        <Link className="button-link" to="/practice/session">
          Back to practice <span aria-hidden="true">→</span>
        </Link>
        <Link className="back-link" to="/">
          Return Home
        </Link>
      </div>
      {confirmClear && (
        <ConfirmationDialog
          idPrefix="clear-all"
          title="Clear all application data?"
          description="This permanently erases all settings, sessions, answers, statistics and saved mistake patterns in this browser. Your current session will end and all preferences will return to their defaults. This cannot be undone. Other websites are not affected."
          cancelLabel="Keep my data"
          confirmLabel="Erase all application data"
          onCancel={() => setConfirmClear(false)}
          onConfirm={confirm}
        />
      )}
    </PageContainer>
  );
}
