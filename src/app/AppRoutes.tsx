import { Route, Routes } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import HomePage from '../pages/HomePage';
import ComingSoonPage from '../pages/ComingSoonPage';
import NotFoundPage from '../pages/NotFoundPage';
import PracticeSetupPage from '../pages/PracticeSetupPage';
import PracticeSessionPage from '../pages/PracticeSessionPage';
import SettingsPage from '../pages/SettingsPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<HomePage />} />
        <Route path="practice/setup" element={<PracticeSetupPage />} />
        <Route path="practice/session" element={<PracticeSessionPage />} />
        <Route
          path="practice/summary"
          element={
            <ComingSoonPage
              title="Your practice recap"
              description="Celebrate the small steps you take."
            />
          }
        />
        <Route
          path="statistics"
          element={
            <ComingSoonPage
              title="See your progress"
              description="Discover how your practice adds up."
            />
          }
        />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
