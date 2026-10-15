import AppRoutes from './AppRoutes';
import AppProvider from './AppProvider';

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
