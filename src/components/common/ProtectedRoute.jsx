import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

// 화면 접근 편의용. 최종 권한 확인은 서버에서 함
export default function ProtectedRoute({ role }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const myRole = useAuthStore((s) => s.role);

  if (!accessToken) return <Navigate to="/login" replace />;
  if (role && myRole !== role) return <Navigate to="/" replace />;
  return <Outlet />;
}
