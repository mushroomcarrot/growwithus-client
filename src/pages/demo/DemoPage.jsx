import { useCallback, useEffect, useRef, useState } from 'react';
import { authService, demoService } from '../../services';
import { USE_MOCK } from '../../services/mock';
import { useAuthStore } from '../../store/authStore';
import { STAGES, STAGE_LABEL, WEATHER_LABEL } from '../../utils/labels';
import { FieldError } from '../../components/common/Feedback';
import { IconArrowRight, IconCloudRain, IconFastForward, IconRefresh, IconSun, IconThermo } from '../../components/common/Icons';

const PHONE_W = 390;
const PHONE_H = 844;

const WEATHERS = [
  { value: 'SUNNY', icon: <IconSun size={24} />, color: 'text-[#E0A92E]' },
  { value: 'RAIN', icon: <IconCloudRain size={24} />, color: 'text-blue' },
  { value: 'HOT', icon: <IconThermo size={24} />, color: 'text-[#C2453A]' },
];

function usePhoneScale() {
  const calc = () => Math.min(1, (window.innerHeight - 96) / PHONE_H);
  const [scale, setScale] = useState(calc);
  useEffect(() => {
    const onResize = () => setScale(calc());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return scale;
}

function PhoneFrame({ title, src, frameRef, scale }) {
  return (
    <figure className="flex flex-col items-center gap-2">
      <figcaption className="text-sm font-bold text-[#4A5145]">{title}</figcaption>
      <div style={{ width: PHONE_W * scale, height: PHONE_H * scale }}>
        <div
          className="overflow-hidden rounded-[36px] border-[6px] border-[#1F2A1F] bg-cream shadow-xl"
          style={{ width: PHONE_W + 12, height: PHONE_H + 12, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <iframe ref={frameRef} title={title} src={src} width={PHONE_W} height={PHONE_H} className="block border-0" allow="camera; microphone" />
        </div>
      </div>
    </figure>
  );
}

function AdminLogin() {
  const login = useAuthStore((s) => s.login);
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await authService.login(form);
      if (res.role !== 'ADMIN') {
        setError('시연용 ADMIN 계정으로 로그인해 주세요.');
        return;
      }
      login(res);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <p className="text-sm text-sub">데모 패널은 시연용 ADMIN 계정으로만 동작해요.</p>
      <input
        aria-label="아이디"
        placeholder="ADMIN 아이디"
        autoComplete="username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        className="h-12 rounded-xl border-[1.5px] border-[#D9D3C4] px-3"
      />
      <input
        aria-label="비밀번호"
        type="password"
        placeholder="비밀번호"
        autoComplete="current-password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        className="h-12 rounded-xl border-[1.5px] border-[#D9D3C4] px-3"
      />
      <FieldError>{error}</FieldError>
      <button type="submit" className="h-12 rounded-xl bg-ink font-bold text-white">
        로그인
      </button>
    </form>
  );
}

export default function DemoPage() {
  const scale = usePhoneScale();
  const ownerRef = useRef(null);
  const careRef = useRef(null);
  const { accessToken, role, login, logout } = useAuthStore();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const isAdmin = Boolean(accessToken) && role === 'ADMIN';

  // 목업 모드에서는 ADMIN으로 자동 로그인
  useEffect(() => {
    if (USE_MOCK && !isAdmin) authService.login({ username: 'admin', password: 'mock' }).then(login);
  }, [isAdmin, login]);

  // 로그인 화면으로 나가기: 기기에 저장된 로그인까지 지우고 새로 불러옴
  const exitDemo = async () => {
    try {
      await authService.logout();
    } catch {
      // 서버 로그아웃이 실패해도 나감
    }
    logout();
    try {
      localStorage.removeItem('daesin-auth');
    } catch {
      // 저장소를 못 쓰는 환경
    }
    window.location.assign('/login');
  };

  const notify = (type) => {
    [ownerRef, careRef].forEach((ref) => ref.current?.contentWindow?.postMessage({ type }, window.location.origin));
  };

  const loadState = useCallback(async () => {
    try {
      setState(await demoService.getState());
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) loadState();
  }, [isAdmin, loadState]);

  const run = async (key, fn, message = 'demo-refresh') => {
    setBusy(key);
    setError('');
    try {
      await fn();
      await loadState();
      notify(message);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="flex min-h-full items-start justify-center gap-6 bg-[#EFEAE0] p-6">
      <PhoneFrame title="텃밭 주인 (수지 · 민지네)" src="/owner?demo=owner" frameRef={ownerRef} scale={scale} />
      <PhoneFrame title="텃밭 관리사 (처인 · 순자 님)" src="/caretaker?demo=caretaker" frameRef={careRef} scale={scale} />

      <aside className="flex w-[340px] shrink-0 flex-col gap-6 self-stretch rounded-[20px] border border-line bg-white p-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white">DEMO</span>
            <button type="button" onClick={exitDemo} className="text-[13px] font-bold text-sub underline">
              로그인 화면으로
            </button>
          </div>
          <h1 className="mt-1 text-[22px] font-extrabold">데모 컨트롤</h1>
          <p className="text-[13px] text-sub">누르면 주인·관리사 화면에 바로 반영돼요</p>
        </div>

        {!isAdmin ? (
          USE_MOCK ? <p className="text-sm text-sub">시연 계정으로 접속하고 있어요…</p> : <AdminLogin />
        ) : (
          <>
            <section className="flex flex-col gap-2.5">
              <h2 className="text-sm font-extrabold">처인구 날씨</h2>
              <div className="grid grid-cols-3 gap-2" role="group" aria-label="날씨 선택">
                {WEATHERS.map((w) => {
                  const selected = state?.weather === w.value;
                  return (
                    <button
                      key={w.value}
                      type="button"
                      aria-pressed={selected}
                      disabled={Boolean(busy)}
                      onClick={() => run(`w-${w.value}`, () => demoService.setWeather(w.value))}
                      className={`flex h-[72px] flex-col items-center justify-center gap-1 rounded-[14px] text-sm font-bold ${
                        selected ? 'border-2 border-blue bg-[#E8F0FA] text-[#1F3F80]' : 'border border-[#DDD6C6] bg-white'
                      }`}
                    >
                      <span className={w.color}>{w.icon}</span>
                      {busy === `w-${w.value}` ? '바꾸는 중' : WEATHER_LABEL[w.value]}
                    </button>
                  );
                })}
              </div>
              <p className="rounded-xl bg-[#F4F1EA] px-3.5 py-3 text-xs leading-relaxed text-[#3B4A36]">
                <b>바뀌는 것</b>
                <br />
                주인: 캐릭터(우산·땀), 말풍선
                <br />
                관리사: 날씨 안내, 물 주기 작업 빼기
              </p>
            </section>

            <section className="flex flex-col gap-2.5">
              <h2 className="text-sm font-extrabold">성장 단계 바꾸기</h2>
              <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="성장 단계 선택">
                {STAGES.map((s) => {
                  const selected = state?.stage === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={selected}
                      disabled={Boolean(busy)}
                      onClick={() => run(`s-${s}`, () => demoService.setStage(s))}
                      className={`h-11 rounded-xl text-[13px] font-bold ${
                        selected ? 'border-2 border-leaf bg-leaf-light text-leaf-dark' : 'border border-[#DDD6C6] bg-white'
                      }`}
                    >
                      {busy === `s-${s}` ? '…' : STAGE_LABEL[s]}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-sub">한 단계씩 올리면 주인 화면에 진화 연출이 떠요</p>
            </section>

            <section className="flex flex-col gap-2.5">
              <h2 className="text-sm font-extrabold">시간 빨리 감기</h2>
              <div className="flex items-center gap-2.5 text-[13px] text-[#3B4A36]">
                <span className="rounded-lg bg-leaf-light px-2.5 py-1 font-bold text-leaf-dark">
                  지금 · {state ? `${STAGE_LABEL[state.stage]} ${state.stageProgress}` : '-'}
                </span>
                <IconArrowRight size={16} />
                <span className="rounded-lg bg-[#FDE1DC] px-2.5 py-1 font-bold text-[#9A2F25]">열매 4/4 · 수확일</span>
              </div>
              <button
                type="button"
                disabled={Boolean(busy) || state?.stage === 'FRUIT'}
                onClick={() => run('ff', () => demoService.fastForward(18))}
                className="flex h-[52px] items-center justify-center gap-2 rounded-[14px] bg-leaf text-[15px] font-extrabold text-white disabled:opacity-50"
              >
                <IconFastForward />
                {busy === 'ff' ? '빨리 감는 중' : '18일 빨리 감기'}
              </button>
              <p className="text-xs text-sub">누르면 주인 화면에 열매 진화 연출이 떠요</p>
            </section>

            <FieldError>{error}</FieldError>
            <div className="flex-1" />

            <section className="flex flex-col gap-2 border-t border-[#EEE8DB] pt-4">
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => run('reset', () => demoService.reset(), 'demo-reset')}
                className="flex h-[46px] items-center justify-center gap-2 rounded-[14px] border-[1.5px] border-[#DDD6C6] bg-white text-sm font-bold"
              >
                <IconRefresh />
                {busy === 'reset' ? '되돌리는 중' : '처음 상태로 되돌리기'}
              </button>
              <p className="text-center text-xs text-sub">맑음 · 꽃 단계 · 오늘 할 일 3곳으로 초기화</p>
            </section>
          </>
        )}
      </aside>
    </div>
  );
}