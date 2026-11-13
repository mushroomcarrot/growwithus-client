import { useCallback, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { givenName, useMe } from '../../hooks/useMe';
import { usePolling } from '../../hooks/usePolling';
import { homeService } from '../../services';
import { useUiStore } from '../../store/uiStore';
import { WEATHER_LABEL } from '../../utils/labels';
import { formatTime } from '../../utils/format';
import { TASK_TYPE_LABEL } from '../../utils/labels';
import CropCharacter, { WEATHER_CARD } from '../../components/owner/CropCharacter';
import EvolveOverlay from '../../components/owner/EvolveOverlay';
import { AiLine, StageProgress, StreakXp } from '../../components/owner/OwnerParts';
import CaretakerAvatar from '../../components/common/CaretakerAvatar';
import { ErrorBox, LoadingSpinner } from '../../components/common/Feedback';
import { Heart } from '../../components/common/Icons';

export default function OwnerHomePage() {
  const { me, gardenId, error: meError, reload: reloadMe } = useMe();
  const showToast = useUiStore((s) => s.showToast);
  const [event, setEvent] = useState(null);
  const [busy, setBusy] = useState('');

  const loadHome = useCallback(async () => {
    if (!gardenId) return null;
    const home = await homeService.getHome(gardenId);
    if (home.hasUnreadEvent) {
      const events = await homeService.getEvents(gardenId);
      if (events.length) setEvent((prev) => prev ?? events[0]);
    }
    return home;
  }, [gardenId]);

  const { data: home, setData, error, reload } = useAsync(loadHome, [gardenId]);
  usePolling(() => reload({ silent: true }), { enabled: Boolean(gardenId) && !event });

  if (meError) return <ErrorBox message={meError.message} onRetry={reloadMe} />;
  if (error && !home) return <ErrorBox message={error.message} onRetry={reload} />;
  if (!gardenId || !home) return <LoadingSpinner />;

  const { character, weather, streak, xp, harvest, caretaker, recentCareLog } = home;
  const card = WEATHER_CARD[character.animation] ?? WEATHER_CARD.sunny_happy;
  const caretakerName = givenName(caretaker?.name);

  const cheer = async () => {
    setBusy('cheer');
    try {
      const res = await homeService.cheer(gardenId);
      setData({ ...home, streak: { days: res.streakDays, cheeredToday: true }, xp: { ...xp, total: res.totalXp } });
      showToast(`${character.name}를 응원했어요 +${res.xpGained}XP`);
    } catch (e) {
      showToast(e.message);
    } finally {
      setBusy('');
    }
  };

  const sendHeart = async () => {
    setBusy('heart');
    try {
      const res = await homeService.sendHeart(recentCareLog.careLogId);
      setData({
        ...home,
        recentCareLog: { ...recentCareLog, hearted: true },
        xp: { ...xp, total: xp.total + (res.xpGained ?? 0) },
      });
      showToast(`${caretakerName} 님께 하트를 보냈어요`);
    } catch (e) {
      showToast(e.message);
    } finally {
      setBusy('');
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-12 pb-4">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-muted">
            {home.farmName ? `${home.farmName} ` : ''}
            {home.plotCode ?? ''}
          </span>
          <h1 className="text-[22px] font-extrabold">
            {home.nickname ?? me?.owner?.nickname ?? ''} {character.cropName ?? character.name}
          </h1>
        </div>
        <StreakXp streak={streak.days} xp={xp.total} />
      </header>

      <section className={`flex flex-col items-center gap-2 rounded-3xl p-4 ${card.bg}`}>
        <div className={`flex justify-between self-stretch text-[13px] font-bold ${card.text}`}>
          <span>
            {weather.area ?? '처인구'} · {WEATHER_LABEL[weather.condition] ?? weather.condition}
          </span>
          <span>{Math.round(weather.temperature)}°C</span>
        </div>
        <CropCharacter stage={character.stage} animation={character.animation} />
        <span className="rounded-2xl bg-white px-4 py-2 text-[13px] font-medium">{character.message}</span>
        <button
          type="button"
          onClick={cheer}
          disabled={streak.cheeredToday || busy === 'cheer'}
          className="mt-1 h-10 rounded-full bg-white/70 px-4 text-[13px] font-bold text-leaf-dark disabled:text-muted"
        >
          {streak.cheeredToday ? `오늘 응원 완료 · ${streak.days}일째` : `${character.name} 응원하기 +10XP`}
        </button>
      </section>

      <StageProgress stage={character.stage} dDay={harvest.dDay} />

      {recentCareLog ? (
        <section className="flex flex-col gap-3 rounded-[20px] bg-white p-4 shadow-[0_2px_10px_rgba(60,50,30,0.08)]">
          <div className="flex items-center gap-3">
            <CaretakerAvatar avatarUrl={caretaker?.avatarUrl} characterId={caretaker?.characterId} name={caretaker?.name} />
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-bold">{caretakerName} 님이 돌봐주셨어요</span>
              <span className="text-xs text-muted">
                {formatTime(recentCareLog.createdAt)}
                {recentCareLog.taskTypes?.length ? ` · ${recentCareLog.taskTypes.map((t) => TASK_TYPE_LABEL[t] ?? t).join(', ')}` : ''}
              </span>
            </div>
          </div>
          {recentCareLog.photoUrl && (
            <img src={recentCareLog.photoUrl} alt="관리사가 찍은 작업 사진" className="h-40 w-full rounded-[14px] object-cover" />
          )}
          <AiLine tone={character.animation === 'rain_umbrella' ? 'blue' : 'green'}>{recentCareLog.summary}</AiLine>
          <button
            type="button"
            onClick={sendHeart}
            disabled={recentCareLog.hearted || busy === 'heart'}
            className={`flex h-[46px] items-center justify-center gap-2 rounded-[14px] text-[15px] font-bold ${
              recentCareLog.hearted ? 'bg-heart-light text-heart-dark' : 'bg-heart text-white'
            }`}
          >
            <Heart color={recentCareLog.hearted ? '#D9507A' : '#FFFFFF'} />
            {recentCareLog.hearted ? '감사 하트를 보냈어요' : '감사 하트 보내기'}
          </button>
        </section>
      ) : (
        <section className="rounded-[20px] bg-white p-4 text-center text-sm text-sub shadow-[0_2px_10px_rgba(60,50,30,0.08)]">
          아직 돌봄 기록이 없어요. {caretakerName ? `${caretakerName} 님이` : '관리사님이'} 곧 돌봐 주실 거예요.
        </section>
      )}

      {event && (
        <EvolveOverlay
          event={event}
          characterName={character.name}
          caretakerName={caretakerName}
          onClose={() => {
            setEvent(null);
            reload({ silent: true });
          }}
        />
      )}
    </main>
  );
}
