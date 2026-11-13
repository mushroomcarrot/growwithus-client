import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useMeStore } from '../../store/ownerStore';
import { pathForNextStep } from '../../utils/nextStep';
import { BackButton } from '../../components/common/Layout';
import { FieldError } from '../../components/common/Feedback';
import { PrimaryButton, TextField } from '../../components/common/Form';

const USERNAME_RE = /^[a-z0-9]{4,20}$/;

function validate(form) {
  const errors = {};
  const name = form.name.trim();
  if (!name || name.length > 20) errors.name = '이름을 1~20자로 입력해 주세요.';
  if (!USERNAME_RE.test(form.username)) errors.username = '영문 소문자와 숫자로 4~20자 입력해 주세요.';
  if (form.password.length < 8 || form.password.length > 64) errors.password = '비밀번호는 8자 이상이에요.';
  if (form.password !== form.passwordConfirm) errors.passwordConfirm = '비밀번호가 서로 달라요.';
  return errors;
}

export default function SignupPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const clearMe = useMeStore((s) => s.clearMe);
  const [form, setForm] = useState({ name: '', username: '', password: '', passwordConfirm: '' });
  const [errors, setErrors] = useState({});
  const [checked, setChecked] = useState(null); // 중복 확인을 통과한 아이디
  const [checking, setChecking] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => {
    const value = key === 'username' ? e.target.value.toLowerCase().trim() : e.target.value;
    setForm({ ...form, [key]: value });
    setErrors({ ...errors, [key]: undefined });
    if (key === 'username') setChecked(null);
  };

  const checkUsername = async () => {
    if (!USERNAME_RE.test(form.username)) {
      setErrors({ ...errors, username: '영문 소문자와 숫자로 4~20자 입력해 주세요.' });
      return;
    }
    setChecking(true);
    try {
      const res = await authService.checkUsername(form.username);
      if (res.available) {
        setChecked(form.username);
        setErrors({ ...errors, username: undefined });
      } else {
        setErrors({ ...errors, username: '이미 사용 중인 아이디예요.' });
      }
    } catch (err) {
      setErrors({ ...errors, username: err.message });
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    if (!found.username && checked !== form.username) found.username = '아이디 중복 확인을 해 주세요.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setLoading(true);
    setSubmitError('');
    try {
      const res = await authService.signup({ name: form.name.trim(), username: form.username, password: form.password });
      clearMe();
      login(res);
      navigate(pathForNextStep(res.nextStep, res.role), { replace: true });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-6 pt-11 pb-safe">
      <BackButton to="/login" label="로그인으로 돌아가기" />
      <h1 className="mt-5 mb-1.5 text-[26px] font-extrabold">대신텃밭 시작하기</h1>
      <p className="text-sm text-sub">이름과 사용할 아이디를 알려주세요</p>

      <form onSubmit={submit} className="mt-7 flex flex-1 flex-col gap-3.5" noValidate>
        <TextField label="이름" name="name" autoComplete="name" placeholder="예: 김민지, 이순자" value={form.name} onChange={update('name')} error={errors.name} />
        <TextField label="아이디" error={errors.username} hint={checked ? '사용할 수 있는 아이디예요' : undefined}>
          <span className="flex gap-2">
            <input
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              placeholder="영문 소문자, 숫자 4~20자"
              value={form.username}
              onChange={update('username')}
              className={`h-[54px] min-w-0 flex-1 rounded-[14px] border-[1.5px] bg-white px-4 text-base font-normal ${
                errors.username ? 'border-[#B53A2E]' : 'border-[#D9D3C4]'
              }`}
            />
            <button
              type="button"
              onClick={checkUsername}
              disabled={checking || !form.username}
              className={`h-[54px] shrink-0 rounded-[14px] border-[1.5px] px-3.5 text-sm font-bold ${
                checked === form.username && checked ? 'border-leaf bg-leaf-light text-leaf-dark' : 'border-leaf bg-white text-leaf-dark'
              } disabled:opacity-50`}
            >
              {checked === form.username && checked ? '확인 완료' : '중복 확인'}
            </button>
          </span>
        </TextField>
        <TextField label="비밀번호" name="password" type="password" autoComplete="new-password" placeholder="8자 이상" value={form.password} onChange={update('password')} error={errors.password} />
        <TextField
          label="비밀번호 확인"
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          placeholder="한 번 더 입력해 주세요"
          value={form.passwordConfirm}
          onChange={update('passwordConfirm')}
          error={errors.passwordConfirm}
        />
        <FieldError>{submitError}</FieldError>
        <div className="flex-1" />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? '가입하고 있어요' : '다음'}
        </PrimaryButton>
      </form>
      <p className="mt-3.5 text-center text-sm text-sub">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="font-bold text-leaf-dark">
          로그인
        </Link>
      </p>
    </main>
  );
}
