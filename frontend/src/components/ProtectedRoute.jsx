import { Navigate } from 'react-router-dom';
import useStore from '../store/useStore';

export default function ProtectedRoute({ children }) {
  const { isAdminAuthenticated } = useStore();

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
}