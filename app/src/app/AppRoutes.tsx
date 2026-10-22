import { Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import HomePage from '../pages/HomePage';
import StatisticsPage from '../pages/StatisticsPage';
import NotFoundPage from '../pages/NotFoundPage';
import PracticeSetupPage from '../pages/PracticeSetupPage';
import PracticeSessionPage from '../pages/PracticeSessionPage';
import SettingsPage from '../pages/SettingsPage';
import SessionSummaryPage from '../pages/SessionSummaryPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="practice/setup" element={<PracticeSetupPage />} />
        <Route path="practice/session" element={<PracticeSessionPage />} />
        <Route path="practice/summary" element={<SessionSummaryPage />} />
        <Route path="statistics" element={<StatisticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
