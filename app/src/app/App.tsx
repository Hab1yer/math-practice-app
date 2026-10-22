import AppRoutes from './AppRoutes';
import AppProvider from './AppProvider';
import NavigationSafety from '../components/layout/NavigationSafety';
import ErrorBoundary from '../components/layout/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <NavigationSafety>
          <AppRoutes />
        </NavigationSafety>
      </AppProvider>
    </ErrorBoundary>
  );
}
