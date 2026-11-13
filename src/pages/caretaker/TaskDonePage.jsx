import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { taskService } from '../../services';
import { findInToday, gardenCards } from '../../hooks/useTodayTask';
import { useCaretakerStore } from '../../store/caretakerStore';
import { STAGE_LABEL } from '../../utils/labels';
import { ErrorBox, FieldError, LoadingSpinner } from '../../components/common/Feedback';
import { FlowerBurst } from '../../components/common/Characters';
import { Blossom, Heart, IconCheck, IconSprout, MiniTomato } from '../../components/common/Icons';

// 지금 단계에서 볼 수 있는 모습만 보여줌
// 씨앗 → 새싹이 났어요 / 새싹 → 꽃이 폈어요 / 꽃 → 꽃이 폈어요·열매가 맺혔어요 (+ 아직 그대로예요)
function stageOptions(expectedStage) {
  const show = {
    SPROUT: ['SPROUT', 'NO_CHANGE'],
    FLOWER: ['FLOWER', 'NO_CHANGE'],
    FRUIT: ['FLOWER', 'FRUIT', 'NO_CHANGE'],
  }[expectedStage] ?? ['FLOWER', 'FRUIT', 'NO_CHANGE'];
  return OPTIONS.filter((o) => show.includes(o.value));
}

const OPTIONS = [
  { value: 'SPROUT', label: '새싹이 났어요', icon: <IconSprout size={20} />, bg: 'bg-leaf-light text-leaf-dark' },
  { value: 'FLOWER', label: '꽃이 폈어요', icon: <Blossom />, bg: 'bg-[#FFF1C2]' },
  { value: 'FRUIT', label: '열매가 맺혔어요', icon: <MiniTomato />, bg: 'bg-[#FDE1DC]' },
  {
    value: 'NO_CHANGE',
    label: '아직 그대로예요',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4A5145" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
        <path d="M5 12h14" />
      </svg>
    ),
    bg: 'bg-[#EEE8DB]',
  },
];

// 텃밭의 남은 작업까지 모두 완료 처리 (첫 작업에 사진·음성을 붙임)
async function completeGarden(taskId, photoId, voiceMemoId) {
  const today = await taskService.getToday();
  const { garden } = findInToday(today, taskId);
  const ids = [taskId, ...(garden?.tasks ?? []).filter((t) => t.status === 'TODO' && t.taskId !== taskId).map((t) => t.taskId)];
  let last = null;
  for (const [i, id] of ids.entries()) {
    try {
      last = await taskService.complete(id, i === 0 ? { photoId, voiceMemoId } : {});
    } catch (e) {
      if (e.code !== 'C4095') throw e; // 이미 완료된 작업은 넘어감
    }
  }
  const after = await taskService.getToday();
  return { garden, result: last, today: after };
}

export default function TaskDonePage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { photoId, voiceMemoId, resetTask } = useCaretakerStore();
  const startedRef = useRef(false);
  const [state, setState] = useState({ loading: true, error: null, garden: null, result: null, today: null });
  const [hearts, setHearts] = useState(null);
  const [stage, setStage] = useState({ value: null, sending: false, done: null, error: '' });

  const run = async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await completeGarden(taskId, photoId, voiceMemoId);
      setState({ loading: false, error: null, ...data });
      resetTask();
      taskService.getHeartsForToday().then(setHearts).catch(() => {});
    } catch (e) {
      setState((s) => ({ ...s, loading: false, error: e }));
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickStage = async (value) => {
    const gardenId = state.result?.stageCheck?.gardenId ?? state.garden?.gardenId;
    setStage({ value, sending: true, done: null, error: '' });
    try {
      const res = await taskService.checkStage(gardenId, value, photoId ?? undefined);
      setStage({ value, sending: false, done: res, error: '' });
    } catch (e) {
      setStage({ value: null, sending: false, done: null, error: e.message });
    }
  };

  if (state.loading) return <LoadingSpinner large label="가족에게 소식을 전하고 있어요" />;
  if (state.error) return <ErrorBox large message={state.error.message} onRetry={run} />;

  const { garden, result, today } = state;
  const cropShort = garden?.cropName?.replace('방울', '') ?? '작물';
  const needsStage = result?.stageCheck?.required;
  const next = gardenCards(today).find((c) => !c.done);

  return (
    <main className="flex flex-1 flex-col gap-3.5 px-5 pt-12 pb-safe">
      <section className="flex flex-col items-center gap-1.5 rounded-3xl bg-leaf-light px-4 py-5">
        <div className="animate-pop-in">
          <FlowerBurst size={100} />
        </div>
        <h1 className="text-[28px] font-extrabold">잘하셨어요!</h1>
        <p className="text-center text-[17px] leading-normal text-[#3B4A36]">
          {garden?.ownerNickname ?? '가족'} 가족에게
          <br />
          소식을 전했어요
        </p>
      </section>

      {needsStage && (
        <section className="flex flex-col gap-2.5">
          <h2 className="mt-1 text-xl font-extrabold">{cropShort}가 지금 어때요?</h2>
          {stageOptions(garden?.stageCheck?.expectedStage).map((opt) => {
            const selected = stage.value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={selected}
                disabled={stage.sending || Boolean(stage.done)}
                onClick={() => pickStage(opt.value)}
                className={`flex h-[60px] items-center gap-3 rounded-[18px] px-4 text-[19px] font-extrabold ${
                  selected ? 'border-[2.5px] border-leaf bg-leaf-soft' : 'bg-white shadow-[0_2px_8px_rgba(60,50,30,0.07)]'
                } disabled:cursor-default`}
              >
                <span className={`flex h-9 w-9 items-center justify-center rounded-full ${opt.bg}`}>{opt.icon}</span>
                <span className="flex-1 text-left">{opt.label}</span>
                {selected && (
                  <span className="text-leaf-dark">
                    <IconCheck />
                  </span>
                )}
              </button>
            );
          })}
          <FieldError>{stage.error}</FieldError>
          {stage.done && (
            <p className="text-[15px] text-[#4A5145]" role="status">
              {stage.value === 'NO_CHANGE'
                ? '알려주셔서 고마워요. 그대로 지켜볼게요.'
                : `가족 앱의 캐릭터도 ${STAGE_LABEL[stage.done.stage]} 단계로 맞췄어요`}
            </p>
          )}
        </section>
      )}

      {hearts > 0 && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-heart-light px-3.5 py-3">
          <Heart size={22} />
          <span className="text-base font-bold text-[#7E2244]">가족에게서 감사 하트가 도착했어요</span>
        </div>
      )}

      <div className="flex-1" />
      <button
        type="button"
        disabled={needsStage && !stage.done}
        onClick={() => navigate('/caretaker', { replace: true })}
        className="flex h-[76px] flex-col items-center justify-center gap-0.5 rounded-[20px] bg-leaf text-white shadow-[0_4px_0_#3A6E30] disabled:opacity-50 disabled:shadow-none"
      >
        <span className="text-[22px] font-extrabold">{next ? '다음 할 일 보기' : '오늘 일 끝내기'}</span>
        {next && (
          <span className="text-[15px] font-medium text-leaf-light">
            {next.garden.plotCode} {next.garden.cropName} · {next.todo[0].title}
          </span>
        )}
      </button>
      {needsStage && !stage.done && <p className="text-center text-sm text-sub">위에서 지금 모습을 골라 주세요</p>}
    </main>
  );
}