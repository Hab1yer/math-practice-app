import { Link } from 'react-router-dom';
import Navigation from './Navigation';

export default function Header() {
  return (
    <header className="site-header">
      <Link className="brand" to="/" aria-label="Math Practice home">
        <span className="brand-mark" aria-hidden="true">
          +
        </span>
        Math Practice
      </Link>
      <Navigation />
    </header>
  );
}
