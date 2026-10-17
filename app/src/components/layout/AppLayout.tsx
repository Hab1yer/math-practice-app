import { Outlet } from 'react-router-dom';
import Header from './Header';

export default function AppLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      <Outlet />
      <footer className="site-footer">
        <span>Made for curious minds.</span>
        <span>Small steps count.</span>
      </footer>
    </div>
  );
}
