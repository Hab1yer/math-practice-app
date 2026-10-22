import { Route, Routes } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppLayout from '../components/layout/AppLayout';
import HomePage from '../pages/HomePage';
import NotFoundPage from '../pages/NotFoundPage';
import PracticeSetupPage from '../pages/PracticeSetupPage';
import PracticeSessionPage from '../pages/PracticeSessionPage';
import PrivacyPage from '../pages/PrivacyPage';
import SessionSummaryPage from '../pages/SessionSummaryPage';
const StatisticsPage = lazy(() => import('../pages/StatisticsPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

export default function AppRoutes() {
  return (
    <Suspense
      fallback={
        <p className="storage-notice" role="status">
          Opening page…
        </p>
      }
    >
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="practice/setup" element={<PracticeSetupPage />} />
          <Route path="practice/session" element={<PracticeSessionPage />} />
          <Route path="practice/summary" element={<SessionSummaryPage />} />
          <Route path="statistics" element={<StatisticsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
