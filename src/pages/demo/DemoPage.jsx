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

const FRAME_W = PHONE_W + 12; // 테두리 포함
const FRAME_H = PHONE_H + 12;
const CAPTION_H = 28; // 휴대폰 위 제목 줄
const PHONE_GAP = 24; // 두 휴대폰 사이 간격

// 휴대폰 두 대가 들어갈 영역 크기를 재서, 그 안을 꽉 채우는 배율을 구함 (작으면 줄이고 크면 키움)
function usePhoneScale(areaRef) {
  const [scale, setScale] = useState(0.8);
  useEffect(() => {
    const el = areaRef.current;
    if (!el) return undefined;
    const update = () => {
      const { clientWidth: w, clientHeight: h } = el;
      const byHeight = (h - CAPTION_H) / FRAME_H;
      const byWidth = (w - PHONE_GAP) / 2 / FRAME_W;
      setScale(Math.max(0.3, Math.min(byHeight, byWidth)));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [areaRef]);
  return scale;
}

function PhoneFrame({ title, src, frameRef, scale, onLoad }) {
  return (
    <figure className="m-0 flex flex-col items-center">
      <figcaption className="flex h-7 items-center text-sm font-bold text-white/80">{title}</figcaption>
      <div style={{ width: FRAME_W * scale, height: FRAME_H * scale }}>
        <div
          className="overflow-hidden rounded-[36px] border-[6px] border-[#3A3F3A] bg-cream shadow-xl"
          style={{ width: PHONE_W + 12, height: PHONE_H + 12, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          <iframe
            ref={frameRef}
            title={title}
            src={src}
            width={PHONE_W}
            height={PHONE_H}
            onLoad={onLoad}
            className="block border-0"
            allow="camera; microphone"
          />
        </div>
      </div>
    </figure>
  );
}

// 시연 계정 아이디 (비밀번호는 코드에 두지 않음: 공개 저장소·배포 파일에 그대로 드러나기 때문)
const DEMO_USERS = { admin: 'growadmin', owner: 'minji', caretaker: 'soonja' };
const PASS_KEY = 'daesin-demo-pass';

const readSavedPass = () => {
  try {
    return localStorage.getItem(PASS_KEY) ?? '';
  } catch {
    return '';
  }
};

function DemoLogin({ onSubmit, busy, error }) {
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);

  const submit = (e) => {
    e.preventDefault();
    if (password) onSubmit(password, remember);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3" noValidate>
      <p className="text-sm leading-relaxed text-sub">
        시연 비밀번호를 한 번 입력하면 관리자({DEMO_USERS.admin}), 주인({DEMO_USERS.owner}), 관리사({DEMO_USERS.caretaker})로
        한꺼번에 로그인해요.
      </p>
      <input
        aria-label="시연 비밀번호"
        type="password"
        placeholder="시연 비밀번호"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="h-12 rounded-xl border-[1.5px] border-[#D9D3C4] px-3"
      />
      <label className="flex items-center gap-2 text-sm text-sub">
        <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
        이 컴퓨터에 기억하기 (다음부터 자동 로그인)
      </label>
      <FieldError>{error}</FieldError>
      <button type="submit" disabled={busy || !password} className="h-12 rounded-xl bg-ink font-bold text-white disabled:opacity-50">
        {busy ? '로그인하고 있어요' : '세 계정 한꺼번에 로그인'}
      </button>
    </form>
  );
}

export default function DemoPage() {
  const areaRef = useRef(null);
  const scale = usePhoneScale(areaRef);
  const [panelOpen, setPanelOpen] = useState(true);
  const ownerRef = useRef(null);
  const careRef = useRef(null);
  const { accessToken, role, login, logout } = useAuthStore();
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [frameLogin, setFrameLogin] = useState({ owner: '', caretaker: '' });
  const passRef = useRef('');
  const isAdmin = Boolean(accessToken) && role === 'ADMIN';

  // 폰 화면(iframe)에 시연 계정 로그인 요청
  const sendFrameLogin = (as) => {
    const ref = as === 'owner' ? ownerRef : careRef;
    if (!passRef.current) return;
    ref.current?.contentWindow?.postMessage(
      { type: 'demo-login', username: DEMO_USERS[as], password: passRef.current },
      window.location.origin
    );
  };

  const loginAll = async (password, remember) => {
    setLoginBusy(true);
    setLoginError('');
    try {
      const res = await authService.login({ username: DEMO_USERS.admin, password });
      if (res.role !== 'ADMIN') throw new Error('관리자 계정이 아니에요.');
      passRef.current = password;
      try {
        if (remember) localStorage.setItem(PASS_KEY, password);
        else localStorage.removeItem(PASS_KEY);
      } catch {
        // 저장소를 못 쓰는 환경
      }
      login(res);
      sendFrameLogin('owner');
      sendFrameLogin('caretaker');
    } catch (e) {
      setLoginError(e.message);
    } finally {
      setLoginBusy(false);
    }
  };

  // 폰 화면의 로그인 결과 받기
  useEffect(() => {
    const onMessage = (e) => {
      if (e.origin !== window.location.origin) return;
      if (e.data?.type === 'demo-ready' && ['owner', 'caretaker'].includes(e.data.as)) sendFrameLogin(e.data.as);
      if (e.data?.type === 'demo-login-result') {
        setFrameLogin((prev) => ({ ...prev, [e.data.as]: e.data.ok ? 'ok' : e.data.message || '실패' }));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // 이 컴퓨터에 기억해 둔 비밀번호가 있으면 자동으로 로그인
  useEffect(() => {
    if (USE_MOCK) return;
    const saved = readSavedPass();
    if (saved) loginAll(saved, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      localStorage.removeItem(PASS_KEY);
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
    // 화면 전체에 고정해서 스크롤이 생기지 않게 함
    <div className="fixed inset-0 flex gap-4 overflow-hidden bg-black p-4">
      <div ref={areaRef} className="flex min-w-0 flex-1 items-center justify-center" style={{ gap: PHONE_GAP }}>
        <PhoneFrame
          title="텃밭 주인 (수지 · 민지네)"
          src="/owner?demo=owner"
          frameRef={ownerRef}
          scale={scale}
          onLoad={() => sendFrameLogin('owner')}
        />
        <PhoneFrame
          title="텃밭 관리사 (처인 · 순자 님)"
          src="/caretaker?demo=caretaker"
          frameRef={careRef}
          scale={scale}
          onLoad={() => sendFrameLogin('caretaker')}
        />
      </div>

      {!panelOpen && (
        <button
          type="button"
          onClick={() => setPanelOpen(true)}
          className="absolute top-4 right-4 rounded-full bg-white/15 px-4 py-2 text-[13px] font-bold text-white opacity-70 hover:opacity-100"
        >
          데모 컨트롤 열기
        </button>
      )}

      {/* 숨겨도 상태가 유지되도록 화면에서만 감춤 */}
      <aside
        className={`${panelOpen ? 'flex' : 'hidden'} w-[340px] shrink-0 flex-col gap-6 overflow-y-auto rounded-[20px] border border-line bg-white p-6`}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-md bg-ink px-2 py-0.5 text-[11px] font-extrabold tracking-wide text-white">DEMO</span>
            <span className="flex items-center gap-3">
              <button type="button" onClick={exitDemo} className="text-[13px] font-bold text-sub underline">
                로그인 화면으로
              </button>
              <button
                type="button"
                onClick={() => setPanelOpen(false)}
                className="rounded-lg border border-line px-2.5 py-1 text-[13px] font-bold"
              >
                숨기기
              </button>
            </span>
          </div>
          <h1 className="mt-1 text-[22px] font-extrabold">데모 컨트롤</h1>
          <p className="text-[13px] text-sub">누르면 주인·관리사 화면에 바로 반영돼요</p>
        </div>

        {!isAdmin ? (
          USE_MOCK ? (
            <p className="text-sm text-sub">시연 계정으로 접속하고 있어요…</p>
          ) : (
            <DemoLogin onSubmit={loginAll} busy={loginBusy} error={loginError} />
          )
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

            {[
              ['owner', '주인 화면'],
              ['caretaker', '관리사 화면'],
            ].map(([as, label]) =>
              frameLogin[as] && frameLogin[as] !== 'ok' ? (
                <FieldError key={as}>{`${label} 로그인 실패: ${frameLogin[as]}`}</FieldError>
              ) : null
            )}
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