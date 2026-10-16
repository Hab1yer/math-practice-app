import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
import { usePracticeConfiguration } from '../hooks/usePracticeConfiguration';
import { difficultyOptions, operationOptions } from '../utils/practiceOptions';
import CardPreview from '../components/practice/CardPreview';

export default function PracticeSessionPage() {
  const { configuration } = usePracticeConfiguration();
  return (
    <PageContainer eyebrow="One step closer" title="Your practice space">
      {configuration ? (
        <>
          <CardPreview configuration={configuration} />
          <dl
            className="configuration-summary"
            aria-label="Selected practice configuration"
          >
            <div>
              <dt>Operations</dt>
              <dd>
                {operationOptions
                  .filter((option) =>
                    configuration.operations.includes(option.value),
                  )
                  .map((option) => option.label)
                  .join(', ')}
              </dd>
            </div>
            <div>
              <dt>Difficulty</dt>
              <dd>
                {
                  difficultyOptions.find(
                    (option) => option.value === configuration.difficulty,
                  )?.label
                }
              </dd>
            </div>
            <div>
              <dt>Session length</dt>
              <dd>
                {configuration.sessionLength === 'continuous'
                  ? 'Continuous'
                  : `${configuration.sessionLength} questions`}
              </dd>
            </div>
            <div>
              <dt>Mode</dt>
              <dd>
                {configuration.mode === 'regular'
                  ? 'Regular practice'
                  : 'Mistake review'}
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <p className="intro">Choose what you’d like to practice first.</p>
      )}
      <Link className="button-link" to="/practice/setup">
        {configuration ? 'Change practice choices' : 'Choose your practice'}{' '}
        <span aria-hidden="true">→</span>
      </Link>
      <Link className="back-link" to="/">
        Return Home
      </Link>
    </PageContainer>
  );
}
