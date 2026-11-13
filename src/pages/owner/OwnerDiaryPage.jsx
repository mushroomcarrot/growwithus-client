import { useCallback, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { useMe } from '../../hooks/useMe';
import { usePolling } from '../../hooks/usePolling';
import { diaryService, homeService } from '../../services';
import { useUiStore } from '../../store/uiStore';
import { STAGE_LABEL, TASK_TYPE_LABEL } from '../../utils/labels';
import { formatTime, relativeDayLabel } from '../../utils/format';
import CaretakerAvatar from '../../components/common/CaretakerAvatar';
import { EmptyState, ErrorBox, LoadingSpinner } from '../../components/common/Feedback';
import { Blossom, Heart } from '../../components/common/Icons';
import { AiLine } from '../../components/owner/OwnerParts';

const FILTERS = [
  { value: 'ALL', label: '전체' },
  { value: 'PHOTO', label: '사진' },
  { value: 'STAGE', label: '성장 단계' },
];

function groupByDate(items) {
  const groups = [];
  items.forEach((item) => {
    const last = groups[groups.length - 1];
    if (last && last.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
  });
  return groups;
}

function CareLogItem({ item, onHeart, sending }) {
  return (
    <article className="flex flex-col gap-2.5 rounded-[20px] bg-white p-3.5 shadow-[0_2px_10px_rgba(60,50,30,0.08)]">
      <div className="flex items-center gap-2.5">
        <CaretakerAvatar size={36} name={item.caretakerName} />
        <div className="flex flex-1 flex-col">
          <span className="text-sm font-bold">{item.caretakerName} 님</span>
          <span className="text-xs text-muted">
            {item.createdAt ? `${formatTime(item.createdAt)} · ` : ''}
            {(item.taskTypes ?? []).map((t) => TASK_TYPE_LABEL[t] ?? t).join(', ')}
          </span>
        </div>
      </div>
      {item.photoUrl && (
        <figure className="relative overflow-hidden rounded-[14px]">
          <img src={item.photoUrl} alt="작업 인증 사진" className="h-[168px] w-full object-cover" />
          <figcaption className="absolute top-2.5 left-2.5 rounded-lg bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#3B4A36]">
            작업 인증 사진
          </figcaption>
        </figure>
      )}
      {item.transcript && (
        <p className="rounded-xl bg-[#FBF5E6] px-3 py-2.5 text-[13px] leading-relaxed text-[#3B3424]">“{item.transcript}”</p>
      )}
      <AiLine>{item.summary}</AiLine>
      <button
        type="button"
        onClick={() => onHeart(item)}
        disabled={item.hearted || sending}
        className="flex h-[42px] items-center justify-center gap-1.5 rounded-xl bg-heart-light text-sm font-bold text-heart-dark"
      >
        <Heart size={16} />
        {item.hearted ? '감사 하트를 보냈어요' : '감사 하트 보내기'}
      </button>
    </article>
  );
}

function StageItem({ item }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-sun px-3.5 py-3">
      <Blossom size={28} />
      <div className="flex flex-col">
        <span className="text-[13px] font-extrabold text-[#6B4A07]">{STAGE_LABEL[item.toStage]} 단계가 됐어요</span>
        <span className="text-xs text-[#6B5A2E]">
          {STAGE_LABEL[item.fromStage] ? `${STAGE_LABEL[item.fromStage]}에서 한 단계 자랐어요` : '한 단계 자랐어요'}
        </span>
      </div>
    </div>
  );
}

function RestItem({ item }) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl bg-white px-3.5 py-3 shadow-[0_2px_10px_rgba(60,50,30,0.06)]">
      <span className="shrink-0 rounded-md bg-leaf px-1.5 py-0.5 text-[11px] font-extrabold text-white">AI</span>
      <span className="text-xs leading-normal text-[#3B4A36]">{item.message}</span>
    </div>
  );
}

export default function OwnerDiaryPage() {
  const { me, gardenId } = useMe();
  const showToast = useUiStore((s) => s.showToast);
  const [filter, setFilter] = useState('ALL');
  const [extra, setExtra] = useState({ items: [], nextCursor: undefined });
  const [sending, setSending] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async () => {
    if (!gardenId) return null;
    return diaryService.getDiary(gardenId, filter);
  }, [gardenId, filter]);

  const { data, setData, loading, error, reload } = useAsync(load, [gardenId, filter]);
  usePolling(() => reload({ silent: true }), { enabled: Boolean(gardenId) && extra.items.length === 0 });

  const items = [...(data?.items ?? []), ...extra.items];
  const nextCursor = extra.nextCursor === undefined ? data?.nextCursor : extra.nextCursor;

  const changeFilter = (value) => {
    setFilter(value);
    setExtra({ items: [], nextCursor: undefined });
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await diaryService.getDiary(gardenId, filter, nextCursor);
      setExtra((prev) => ({ items: [...prev.items, ...res.items], nextCursor: res.nextCursor }));
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoadingMore(false);
    }
  };

  const heart = async (item) => {
    setSending(item.careLogId);
    try {
      await homeService.sendHeart(item.careLogId);
      const mark = (list) => list.map((i) => (i.careLogId === item.careLogId ? { ...i, hearted: true } : i));
      setData({ ...data, items: mark(data.items) });
      setExtra((prev) => ({ ...prev, items: mark(prev.items) }));
      showToast('감사 하트를 보냈어요');
    } catch (e) {
      showToast(e.message);
    } finally {
      setSending(null);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-3.5 px-5 pt-12 pb-4">
      <header className="flex flex-col gap-0.5">
        <span className="text-xs text-muted">{me?.owner?.nickname ?? ''} 텃밭</span>
        <h1 className="text-[22px] font-extrabold">성장 일기</h1>
      </header>

      <div className="flex gap-2" role="group" aria-label="일기 종류">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            aria-pressed={filter === f.value}
            onClick={() => changeFilter(f.value)}
            className={`h-8 rounded-full px-3.5 text-[13px] ${
              filter === f.value ? 'bg-leaf-dark font-bold text-white' : 'border border-[#DDD6C6] bg-white text-[#3B4A36]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading || (!data && !error) ? (
        <LoadingSpinner />
      ) : error && !data ? (
        <ErrorBox message={error.message} onRetry={reload} />
      ) : items.length === 0 ? (
        <EmptyState title="아직 기록이 없어요" description="관리사님이 돌보면 여기에 쌓여요." />
      ) : (
        <>
          {groupByDate(items).map((group) => (
            <section key={group.date} className="flex flex-col gap-3">
              <h2 className="text-[13px] font-bold text-sub">{relativeDayLabel(group.date)}</h2>
              {group.items.map((item, i) => {
                if (item.type === 'CARE_LOG')
                  return <CareLogItem key={item.careLogId} item={item} onHeart={heart} sending={sending === item.careLogId} />;
                if (item.type === 'STAGE_CHANGE') return <StageItem key={`stage-${group.date}-${i}`} item={item} />;
                return <RestItem key={`rest-${group.date}-${i}`} item={item} />;
              })}
            </section>
          ))}
          {nextCursor && (
            <button
              type="button"
              onClick={loadMore}
              disabled={loadingMore}
              className="h-11 rounded-xl border border-[#DDD6C6] bg-white text-sm font-bold"
            >
              {loadingMore ? '불러오고 있어요' : '이전 기록 더 보기'}
            </button>
          )}
        </>
      )}
    </main>
  );
}
