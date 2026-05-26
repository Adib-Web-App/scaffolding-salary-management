import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppBranding from './AppBranding';
import LoadingSpinner from './LoadingSpinner';
import { usePageTitle } from '../hooks/usePageTitle';

export default function ProtectedRoute({ children, permission }) {
  const { user, loading, hasPermission } = useAuth();
  const location = useLocation();

  usePageTitle(loading ? 'Loading' : null);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-50 p-4">
        <AppBranding variant="loading" />
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (permission && !hasPermission(permission)) {
    return <Navigate to="/access-denied" replace />;
  }

  return children;
}
