import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useAppPreferences } from '../../hooks/useAppPreferences';

export default function AppLayout() {
  const { storageWarning } = useAppPreferences();
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header />
      {storageWarning && (
        <p className="storage-notice" role="status" aria-label="Saving status">
          {storageWarning}
        </p>
      )}
      <Outlet />
      <footer className="site-footer">
        <span>Made for curious minds.</span>
        <span>Small steps count.</span>
      </footer>
    </div>
  );
}
