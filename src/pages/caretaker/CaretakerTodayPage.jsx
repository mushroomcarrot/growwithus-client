import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { usePolling } from '../../hooks/usePolling';
import { givenName, useMe } from '../../hooks/useMe';
import { gardenCards } from '../../hooks/useTodayTask';
import { authService, taskService } from '../../services';
import { demoAs, useAuthStore } from '../../store/authStore';
import { useCaretakerStore } from '../../store/caretakerStore';
import { useMeStore } from '../../store/ownerStore';
import { formatMonthDayWeekday } from '../../utils/format';
import { EmptyState, ErrorBox, LoadingSpinner } from '../../components/common/Feedback';
import ReadAloudButton from '../../components/common/ReadAloudButton';
import { FlowerBurst } from '../../components/common/Characters';
import { IconCheck, IconCloudRain, IconMic, IconSun, IconThermo } from '../../components/common/Icons';

function NoticeIcon({ text }) {
  if (text?.includes('비')) return <IconCloudRain />;
  if (text?.includes('더워')) return <IconThermo />;
  return <IconSun />;
}

export default function CaretakerTodayPage() {
  const navigate = useNavigate();
  const { me } = useMe();
  const startTask = useCaretakerStore((s) => s.startTask);
  const logout = useAuthStore((s) => s.logout);
  const clearMe = useMeStore((s) => s.clearMe);
  const { data: today, loading, error, reload } = useAsync(() => taskService.getToday(), []);
  usePolling(() => reload({ silent: true }));

  const name = givenName(me?.caretaker?.name ?? me?.name ?? '');
  const cards = gardenCards(today);
  const currentIndex = cards.findIndex((c) => !c.done);
  const current = cards[currentIndex];
  const next = cards.slice(currentIndex + 1).find((c) => !c.done);
  const doneCount = cards.filter((c) => c.done).length;

  const doLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // 서버 로그아웃이 실패해도 기기에서는 로그아웃함
    }
    logout();
    clearMe();
    navigate('/login', { replace: true });
  };

  // 시연 화면(iframe) 안에서는 계정이 바뀌면 안 되므로 숨김
  const logoutButton = demoAs ? null : (
    <button type="button" onClick={doLogout} className="h-10 shrink-0 rounded-xl px-3 text-[15px] font-bold text-sub underline">
      로그아웃
    </button>
  );

  if (loading) return <LoadingSpinner large label="오늘 할 일을 불러오고 있어요" />;
  if (error) return <ErrorBox large message={error.message} onRetry={reload} />;

  const header = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="text-[15px] text-[#4A5145]">{formatMonthDayWeekday(today?.date ?? new Date())}</span>
        {logoutButton}
      </div>
      <h1 className="text-[26px] leading-snug font-extrabold">
        {name ? `${name} 님, ` : ''}오늘은
        <br />
        텃밭 <span className="text-leaf-dark">{cards.length}곳</span>만 보시면 돼요
      </h1>
    </div>
  );

  if (cards.length === 0) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-5 pt-12 pb-safe">
        {header}
        <EmptyState large title="오늘은 할 일이 없어요" description="푹 쉬세요. 내일 다시 알려드릴게요." />
      </main>
    );
  }

  if (!current) {
    return (
      <main className="flex flex-1 flex-col gap-4 px-5 pt-12 pb-safe">
        <div className="flex justify-end">{logoutButton}</div>
        <section className="flex flex-col items-center gap-3 text-center">
          <div className="animate-pop-in">
            <FlowerBurst size={110} />
          </div>
          <h1 className="text-[28px] font-extrabold">오늘 {cards.length}곳 다 보셨어요!</h1>
          <p className="text-lg leading-relaxed text-[#3B4A36]">
            수고 많으셨어요.
            <br />
            가족들에게 소식을 모두 전했어요.
          </p>
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-extrabold">오늘 한 일</h2>
          {cards.map(({ garden }) => (
            <div
              key={garden.gardenId}
              className="flex items-center gap-3 rounded-[18px] bg-white px-4 py-3 shadow-[0_2px_8px_rgba(60,50,30,0.07)]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-leaf-light text-leaf-dark">
                <IconCheck size={20} />
              </span>
              <span className="flex flex-1 flex-col text-left">
                <span className="text-[17px] font-extrabold">
                  {garden.plotCode} {garden.ownerNickname} · {garden.cropName}
                </span>
                <span className="text-[15px] text-[#4A5145]">{garden.tasks.map((t) => t.title).join(', ')}</span>
              </span>
            </div>
          ))}
        </section>

        <div className="flex-1" />
        <p className="text-center text-base text-sub">내일 할 일은 아침에 다시 알려드릴게요</p>
      </main>
    );
  }

  const { garden, todo } = current;
  const [main, ...extra] = todo;
  const minutes = todo.reduce((sum, t) => sum + t.minutes, 0);
  const readText = [
    `${garden.plotCode} 밭, ${garden.cropName}.`,
    `${main.title}.`,
    main.description,
    extra.length ? `그리고 ${extra.map((t) => t.title).join(', ')}도 해 주세요.` : '',
    today.weatherNotice ?? '',
  ].join(' ');

  const go = (path) => {
    startTask(main.taskId);
    navigate(`/caretaker/tasks/${main.taskId}/${path}`);
  };

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-12 pb-safe">
      {header}

      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(0, 1fr))` }} aria-label={`${cards.length}곳 중 ${doneCount}곳 완료`}>
        {cards.map((c, i) => (
          <span key={c.garden.gardenId} className={`h-2 rounded ${c.done || i === currentIndex ? 'bg-leaf' : 'bg-[#E4DFD3]'}`} />
        ))}
      </div>

      <section className="flex flex-col gap-2.5 rounded-3xl border-[3px] border-leaf bg-white p-5">
        <div className="flex items-center justify-between">
          <span className="rounded-[10px] bg-leaf-light px-3 py-1 text-base font-extrabold text-leaf-dark">
            {garden.plotCode} 밭
          </span>
          <ReadAloudButton text={readText} />
        </div>
        <span className="text-[17px] text-[#4A5145]">
          {garden.ownerNickname} 텃밭 · {garden.cropName}
        </span>
        <h2 className="text-[32px] leading-tight font-extrabold tracking-tight">{main.title}</h2>
        <p className="text-[17px] leading-relaxed text-[#4A5145]">
          {main.description} · 약 {minutes}분
        </p>
        {extra.length > 0 && (
          <p className="rounded-2xl bg-sand px-4 py-3 text-[17px] font-bold">
            그리고 {extra.map((t) => t.title).join(', ')}도 해 주세요
          </p>
        )}
        {today.weatherNotice && (
          <div className="mt-1.5 flex items-start gap-2.5 rounded-2xl bg-[#E8F0FA] p-3.5 text-[#1F3F80]">
            <NoticeIcon text={today.weatherNotice} />
            <span className="text-lg leading-snug font-bold">{today.weatherNotice}</span>
          </div>
        )}
      </section>

      <div className="flex-1" />

      <button
        type="button"
        onClick={() => go('photo')}
        className="h-[68px] rounded-[20px] bg-leaf text-[22px] font-extrabold text-white shadow-[0_4px_0_#3A6E30] active:translate-y-0.5 active:shadow-none"
      >
        완료했어요
      </button>
      <button
        type="button"
        onClick={() => go('voice')}
        className="flex h-16 items-center justify-center gap-2.5 rounded-[20px] bg-white text-xl font-extrabold shadow-[0_2px_10px_rgba(60,50,30,0.1)]"
      >
        <IconMic />
        말로 남기기
      </button>
      {next && (
        <div className="flex h-12 items-center justify-between rounded-[14px] bg-sand px-4 text-[15px]">
          <span>
            <b>다음</b> {next.garden.plotCode} {next.garden.ownerNickname} {next.garden.cropName} · {next.todo[0].title}
          </span>
          <span aria-hidden="true">›</span>
        </div>
      )}
    </main>
  );
}