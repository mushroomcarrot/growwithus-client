import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import { USE_MOCK } from '../../services/mock';
import { useAuthStore } from '../../store/authStore';
import { useMeStore } from '../../store/ownerStore';
import { pathForNextStep } from '../../utils/nextStep';
import { SproutPot } from '../../components/common/Characters';
import { FieldError } from '../../components/common/Feedback';
import { PrimaryButton, TextField } from '../../components/common/Form';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const clearMe = useMeStore((s) => s.clearMe);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.username.trim() || !form.password) {
      setError('아이디와 비밀번호를 입력해 주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await authService.login({ username: form.username.trim(), password: form.password });
      clearMe();
      login(res);
      navigate(pathForNextStep(res.nextStep, res.role), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-6 pt-20 pb-safe">
      <div className="flex flex-col items-center gap-3">
        <SproutPot size={104} />
        <h1 className="text-4xl font-extrabold tracking-tight text-leaf-dark">대신텃밭</h1>
        <p className="text-center text-sm leading-relaxed text-sub">
          도시의 가족과 처인구의 손길이
          <br />
          함께 키우는 우리 텃밭
        </p>
      </div>

      <form onSubmit={submit} className="mt-11 flex flex-col gap-3.5" noValidate>
        <TextField
          label="아이디"
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          placeholder="아이디를 입력해 주세요"
          value={form.username}
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        <TextField
          label="비밀번호"
          name="password"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호를 입력해 주세요"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <FieldError>{error}</FieldError>
        <PrimaryButton type="submit" disabled={loading} className="mt-1.5">
          {loading ? '로그인하고 있어요' : '로그인'}
        </PrimaryButton>
      </form>

      <div className="mt-5 flex items-center justify-center gap-3.5 text-sm">
        <Link to="/signup" className="font-bold text-leaf-dark">
          회원가입
        </Link>
      </div>

      {USE_MOCK && (
        <p className="mt-auto rounded-xl bg-sand px-4 py-3 text-center text-xs leading-relaxed text-sub">
          목업 모드 시연 계정 (비밀번호 아무거나)
          <br />
          주인 <b>minji</b> · 관리사 <b>soonja</b> · 데모 <b>admin</b>
        </p>
      )}
    </main>
  );
}
