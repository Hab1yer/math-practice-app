import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';
export default function PrivacyPage() {
  return (
    <PageContainer title="Privacy & saved progress">
      <p className="intro">
        Your practice stays in this browser on this device.
      </p>
      <div className="privacy-copy">
        <p>
          No account or personal details are required. The app saves arithmetic
          questions, answers you mark right or wrong, mistake-review progress
          and preferences in browser storage.
        </p>
        <p>
          The app does not send practice data to a server, use analytics or show
          advertisements. Your hosting provider handles ordinary web requests,
          which can include connection information such as your IP address.
        </p>
        <p>
          Clearing browser or site data removes saved progress. Another device,
          browser profile or website address has separate storage. Private
          browsing may remove progress when it closes.
        </p>
        <p>
          Settings lets you clear all application data. Statistics lets you
          reset practice history while keeping preferences.
        </p>
      </div>
      <Link className="back-link" to="/">
        Return Home
      </Link>
    </PageContainer>
  );
}
