import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useAppPreferences } from '../../hooks/useAppPreferences';
import { Link } from 'react-router-dom';
import ErrorNotice from './ErrorNotice';

export default function AppLayout() {
  const { storageWarning } = useAppPreferences();
  return (
    <div className="app-shell">
      <Header />
      {storageWarning && (
        <ErrorNotice notice label="Saving status">
          {storageWarning}
        </ErrorNotice>
      )}
      <Outlet />
      <footer className="site-footer">
        <span>Made for curious minds.</span>
        <span>Small steps count.</span>
        <Link to="/privacy">Privacy &amp; saved progress</Link>
      </footer>
    </div>
  );
}
