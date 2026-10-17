import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';

export default function NotFoundPage() {
  return (
    <PageContainer eyebrow="A small detour" title="Let’s find our way back.">
      <p className="intro">
        We couldn’t find that page. Home is a good place to start again.
      </p>
      <Link className="button-link" to="/">
        Return Home <span aria-hidden="true">→</span>
      </Link>
    </PageContainer>
  );
}
