import { Link } from 'react-router-dom';
import PageContainer from '../components/layout/PageContainer';

interface ComingSoonPageProps {
  title: string;
  description: string;
}

export default function ComingSoonPage({
  title,
  description,
}: ComingSoonPageProps) {
  return (
    <PageContainer eyebrow="More discoveries ahead" title={title}>
      <div className="coming-soon">
        <span className="status-label">Coming soon</span>
        <p className="intro">{description}</p>
        <p>
          We’re getting this space ready for you. Come back for more math
          adventures!
        </p>
        <Link className="button-link" to="/">
          Return Home <span aria-hidden="true">→</span>
        </Link>
      </div>
    </PageContainer>
  );
}
