import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { givenName, useMe } from '../../hooks/useMe';
import { authService, harvestService, homeService, questService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useMeStore } from '../../store/ownerStore';
import { useUiStore } from '../../store/uiStore';
import { DISTRICT_LABEL } from '../../utils/labels';
import CaretakerAvatar from '../../components/common/CaretakerAvatar';
import { FamilyFace } from '../../components/common/Characters';
import { ErrorBox, LoadingSpinner } from '../../components/common/Feedback';
import { Flame, Heart, IconCamera, MiniTomato } from '../../components/common/Icons';

const QUEST_ICON = {
  heart: <Heart size={18} />,
  cheer: <Flame size={18} />,
  photo: (
    <span className="text-[#3B6FD8]">
      <IconCamera />
    </span>
  ),
};
const QUEST_COLOR = { heart: '#D9507A', cheer: '#E07A2E', photo: '#3B6FD8' };

function questKind(quest) {
  if (quest.title.includes('하트')) return 'heart';
  if (quest.title.includes('사진')) return 'photo';
  return 'cheer';
}

export default function OwnerMyPage() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const clearMe = useMeStore((s) => s.clearMe);
  const showToast = useUiStore((s) => s.showToast);
  const { me, gardenId } = useMe();
  const [claiming, setClaiming] = useState(null);

  const load = useCallback(async () => {
    if (!gardenId) return null;
    const [home, harvest, quests] = await Promise.all([
      homeService.getHome(gardenId),
      harvestService.getHarvest(gardenId),
      questService.getWeekly().catch(() => []),
    ]);
    return { home, harvest, quests };
  }, [gardenId]);

  const { data, setData, error, reload } = useAsync(load, [gardenId]);

  if (error && !data) return <ErrorBox message={error.message} onRetry={reload} />;
  if (!gardenId || !data) return <LoadingSpinner />;

  const { home, harvest, quests } = data;
  const owner = me?.owner;
  const caretaker = home.caretaker;
  const doneCount = quests.filter((q) => q.status !== 'IN_PROGRESS').length;

  const claim = async (quest) => {
    setClaiming(quest.questId);
    try {
      const res = await questService.claim(quest.questId);
      setData({
        ...data,
        quests: quests.map((q) => (q.questId === quest.questId ? { ...q, status: 'CLAIMED' } : q)),
        home: { ...home, xp: { ...home.xp, total: res.totalXp } },
      });
      showToast(`보상 +${res.xpGained}XP를 받았어요`);
    } catch (e) {
      showToast(e.message);
    } finally {
      setClaiming(null);
    }
  };

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

  return (
    <main className="flex flex-1 flex-col gap-3 px-5 pt-11 pb-4">
      <h1 className="text-[22px] font-extrabold">마이페이지</h1>

      <div className="flex items-center gap-3">
        <FamilyFace size={48} />
        <div className="flex flex-1 flex-col">
          <span className="text-base font-extrabold">{owner?.nickname ?? `${me?.name ?? ''} 가족`}</span>
          <span className="text-xs text-muted">
            {DISTRICT_LABEL[owner?.district] ?? ''} · 함께한 지 {harvest.daysCaredTogether}일
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col gap-0.5 rounded-[14px] bg-orange-light px-3 py-2.5">
          <span className="text-[11px] text-[#7A3A0C]">연속 응원</span>
          <span className="text-lg font-extrabold text-orange">{home.streak.days}일</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[14px] bg-blue-light px-3 py-2.5">
          <span className="text-[11px] text-[#1F3F80]">누적 XP</span>
          <span className="text-lg font-extrabold text-blue">{home.xp.total.toLocaleString()}</span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[14px] bg-heart-light px-3 py-2.5">
          <span className="text-[11px] text-[#7E2244]">돌봄 기록</span>
          <span className="text-lg font-extrabold text-heart-dark">{harvest.careLogCount}회</span>
        </div>
      </div>

      <section className="flex flex-col gap-2.5 rounded-[18px] bg-white p-3.5 shadow-[0_2px_10px_rgba(60,50,30,0.08)]">
        <div className="flex items-center justify-between">
          <h2 className="text-[13px] font-extrabold">내 텃밭</h2>
          <span className="rounded-lg bg-leaf-light px-2 py-0.5 text-[11px] font-bold text-leaf-dark">이용 중</span>
        </div>
        <div className="flex items-center gap-2.5">
          <MiniTomato size={34} />
          <div className="flex flex-col">
            <span className="text-[13px] font-bold">
              {home.farmName ?? '주말농장'} {home.plotCode ?? ''}
            </span>
            <span className="text-[11px] text-muted">
              {home.character.cropName ?? '작물'} · 캐릭터 {home.character.name}
            </span>
          </div>
        </div>
        <div className="h-px bg-[#EEE8DB]" />
        <div className="flex items-center gap-2.5">
          <CaretakerAvatar avatarUrl={caretaker?.avatarUrl} characterId={caretaker?.characterId} size={34} name={caretaker?.name} />
          <div className="flex flex-1 flex-col">
            <span className="text-[11px] text-muted">담당 텃밭 관리사</span>
            <span className="text-[13px] font-bold">{givenName(caretaker?.name)} 님</span>
          </div>
        </div>
      </section>

      {quests.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] font-extrabold">주간 퀘스트</h2>
            <span className="text-[11px] text-muted">
              {doneCount}/{quests.length} 완료
            </span>
          </div>
          <section className="flex flex-col rounded-[18px] bg-white px-3.5 py-1.5 shadow-[0_2px_10px_rgba(60,50,30,0.06)]">
            {quests.map((q) => {
              const kind = questKind(q);
              const pct = Math.round((Math.min(q.progress, q.goal) / q.goal) * 100);
              return (
                <div key={q.questId} className="flex items-center gap-2.5 py-2">
                  {QUEST_ICON[kind]}
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="text-xs font-bold">{q.title}</span>
                    <span className="h-1 overflow-hidden rounded bg-[#EEE8DB]" aria-hidden="true">
                      <span className="block h-full rounded" style={{ width: `${pct}%`, background: QUEST_COLOR[kind] }} />
                    </span>
                  </div>
                  {q.status === 'COMPLETED' ? (
                    <button
                      type="button"
                      onClick={() => claim(q)}
                      disabled={claiming === q.questId}
                      className="h-7 rounded-lg bg-[#F7C548] px-2.5 text-xs font-extrabold text-[#4A3200]"
                    >
                      받기
                    </button>
                  ) : q.status === 'CLAIMED' ? (
                    <span className="text-xs font-bold text-blue">완료</span>
                  ) : (
                    <span className="text-xs text-sub">
                      {q.progress}/{q.goal}
                    </span>
                  )}
                </div>
              );
            })}
          </section>
        </>
      )}

      <section className="flex flex-col rounded-[18px] bg-white px-3.5 text-[13px]">
        <div className="flex h-[42px] items-center justify-between border-b border-[#EEE8DB]">
          <span>이용권</span>
          <span className="text-xs text-muted">월 30,000원 (가정)</span>
        </div>
        <button type="button" onClick={doLogout} className="flex h-[42px] items-center justify-between text-left">
          <span>로그아웃</span>
          <span className="text-muted" aria-hidden="true">
            ›
          </span>
        </button>
      </section>
    </main>
  );
}
