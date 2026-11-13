import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { MobileLayout, OwnerTabLayout } from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import { LoadingSpinner } from './components/common/Feedback';
import { authService } from './services';
import { USE_MOCK } from './services/mock';
import { demoAs, useAuthStore } from './store/authStore';
import { useCaretakerStore } from './store/caretakerStore';
import { pathForNextStep } from './utils/nextStep';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import RoleSelectPage from './pages/auth/RoleSelectPage';
import OwnerProfilePage from './pages/auth/OwnerProfilePage';
import CaretakerProfilePage from './pages/auth/CaretakerProfilePage';
import OwnerHomePage from './pages/owner/OwnerHomePage';
import OwnerDiaryPage from './pages/owner/OwnerDiaryPage';
import OwnerHarvestPage from './pages/owner/OwnerHarvestPage';
import OwnerMyPage from './pages/owner/OwnerMyPage';
import CaretakerTodayPage from './pages/caretaker/CaretakerTodayPage';
import TaskPhotoPage from './pages/caretaker/TaskPhotoPage';
import TaskVoicePage from './pages/caretaker/TaskVoicePage';
import TaskDonePage from './pages/caretaker/TaskDonePage';
import DemoPage from './pages/demo/DemoPage';

const DEMO_ACCOUNTS = { owner: 'minji', caretaker: 'soonja' };

function RootRedirect() {
  const { accessToken, nextStep, role } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <Navigate to={pathForNextStep(nextStep, role)} replace />;
}

// 데모 iframe: 목업 모드면 시연 계정으로 자동 로그인, 데모 패널의 초기화 신호를 받으면 첫 화면으로
function DemoBridge({ children }) {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const accessToken = useAuthStore((s) => s.accessToken);
  const resetTask = useCaretakerStore((s) => s.resetTask);
  const needsAutoLogin = Boolean(demoAs && USE_MOCK && !accessToken && DEMO_ACCOUNTS[demoAs]);
  const [ready, setReady] = useState(!needsAutoLogin);

  useEffect(() => {
    if (!needsAutoLogin) return;
    authService
      .login({ username: DEMO_ACCOUNTS[demoAs], password: 'mock' })
      .then(login)
      .finally(() => setReady(true));
  }, [needsAutoLogin, login]);

  useEffect(() => {
    if (!demoAs) return undefined;
    const onMessage = (e) => {
      if (e.origin !== window.location.origin || e.data?.type !== 'demo-reset') return;
      resetTask();
      navigate(demoAs === 'owner' ? '/owner' : '/caretaker', { replace: true });
      setTimeout(() => window.postMessage({ type: 'demo-refresh' }, window.location.origin), 50);
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [navigate, resetTask]);

  if (!ready) return <LoadingSpinner label="시연 계정으로 접속하고 있어요" />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <DemoBridge>
        <Routes>
          <Route path="/demo" element={<DemoPage />} />

          <Route element={<MobileLayout />}>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/role" element={<RoleSelectPage />} />
              <Route path="/profile/owner" element={<OwnerProfilePage />} />
              <Route path="/profile/caretaker" element={<CaretakerProfilePage />} />
            </Route>

            <Route element={<ProtectedRoute role="OWNER" />}>
              <Route element={<OwnerTabLayout />}>
                <Route path="/owner" element={<OwnerHomePage />} />
                <Route path="/owner/diary" element={<OwnerDiaryPage />} />
                <Route path="/owner/harvest" element={<OwnerHarvestPage />} />
                <Route path="/owner/my" element={<OwnerMyPage />} />
              </Route>
            </Route>

            <Route element={<ProtectedRoute role="CARETAKER" />}>
              <Route path="/caretaker" element={<CaretakerTodayPage />} />
              <Route path="/caretaker/tasks/:taskId/photo" element={<TaskPhotoPage />} />
              <Route path="/caretaker/tasks/:taskId/voice" element={<TaskVoicePage />} />
              <Route path="/caretaker/tasks/:taskId/done" element={<TaskDonePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </DemoBridge>
    </BrowserRouter>
  );
}
