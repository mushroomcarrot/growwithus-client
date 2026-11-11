// src/App.jsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MobileLayout from './components/common/MobileLayout';
import ProtectedRoute from './components/common/ProtectedRoute';
import Placeholder from './components/common/Placeholder';
import { useAuthStore } from './store/authStore';
import { NEXT_STEP_PATH } from './utils/nextStep';

function RootRedirect() {
  const { accessToken, nextStep } = useAuthStore();
  if (!accessToken) return <Navigate to="/login" replace />;
  return <Navigate to={NEXT_STEP_PATH[nextStep] ?? '/role'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/demo" element={<Placeholder title="데모 페이지" />} />

        <Route element={<MobileLayout />}>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Placeholder title="로그인" />} />
          <Route path="/signup" element={<Placeholder title="회원가입" />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/role" element={<Placeholder title="역할 선택" />} />
            <Route path="/profile/owner" element={<Placeholder title="주인 프로필" />} />
            <Route path="/profile/caretaker" element={<Placeholder title="관리사 프로필" />} />
          </Route>

          <Route element={<ProtectedRoute role="OWNER" />}>
            <Route path="/owner" element={<Placeholder title="주인 홈" />} />
            <Route path="/owner/diary" element={<Placeholder title="성장 일기" />} />
            <Route path="/owner/harvest" element={<Placeholder title="수확" />} />
            <Route path="/owner/my" element={<Placeholder title="마이페이지" />} />
          </Route>

          <Route element={<ProtectedRoute role="CARETAKER" />}>
            <Route path="/caretaker" element={<Placeholder title="오늘 할 일" />} />
            <Route path="/caretaker/tasks/:taskId/photo" element={<Placeholder title="작업 인증 사진" />} />
            <Route path="/caretaker/tasks/:taskId/voice" element={<Placeholder title="말로 남기기" />} />
            <Route path="/caretaker/tasks/:taskId/done" element={<Placeholder title="완료" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}