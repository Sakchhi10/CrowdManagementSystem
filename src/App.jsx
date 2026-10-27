import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './auth/ProtectedRoute';
import AppLayout from './components/AppLayout';
import { LiveProvider } from './live/LiveContext';
import DashboardPage from './pages/DashboardPage';
import EntriesPage from './pages/EntriesPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <LiveProvider>
              <AppLayout />
            </LiveProvider>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/entries" element={<EntriesPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
