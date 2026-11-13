import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { homeService } from '../../services';
import { STAGE_LABEL } from '../../utils/labels';
import { FruitPlant, FlowerBurst, SproutPot } from '../common/Characters';

const CONFETTI = [
  { x: 40, y: 120, c: '#F7C548', r: 20 },
  { x: 320, y: 96, c: '#D9507A', r: -25 },
  { x: 80, y: 200, c: '#6DAA4F', r: 0 },
  { x: 300, y: 190, c: '#F7C548', r: 15 },
  { x: 350, y: 250, c: '#6DAA4F', r: 35 },
  { x: 24, y: 300, c: '#3B6FD8', r: -15 },
  { x: 200, y: 80, c: '#D9507A', r: 0 },
  { x: 150, y: 140, c: '#E07A2E', r: 50 },
  { x: 340, y: 700, c: '#F7C548', r: 0 },
  { x: 44, y: 690, c: '#D9507A', r: 10 },
];

export default function EvolveOverlay({ event, characterName, caretakerName, onClose }) {
  const navigate = useNavigate();
  const [reward, setReward] = useState(null);
  const [busy, setBusy] = useState(false);
  const closeRef = useRef(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const ack = async () => {
    if (reward) return reward;
    setBusy(true);
    try {
      const res = await homeService.ackEvent(event.eventId);
      setReward(res);
      return res;
    } catch {
      return null; // 이미 확인된 이벤트(C4095)여도 닫음
    } finally {
      setBusy(false);
    }
  };

  const close = async (to) => {
    await ack();
    onClose();
    if (to) navigate(to);
  };

  const fruit = event.toStage === 'FRUIT';
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="evolve-title" className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-[#33452E]/95 px-6">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
        {CONFETTI.map((p, i) => (
          <rect key={i} x={`${(p.x / 390) * 100}%`} y={`${(p.y / 844) * 100}%`} width={p.r ? 10 : 12} height={p.r ? 16 : 12} rx={p.r ? 2 : 6} fill={p.c} className="animate-float" />
        ))}
      </svg>
      <div className="animate-pop-in relative flex w-full max-w-[360px] flex-col items-center gap-3 rounded-[28px] bg-[#FFFBF0] px-5 pt-7 pb-5">
        <span className="rounded-xl bg-[#FFE9A8] px-3 py-1 text-xs font-extrabold text-[#6B4A07]">
          {STAGE_LABEL[event.toStage]} 단계 도착 · {['SEED', 'SPROUT', 'FLOWER', 'FRUIT'].indexOf(event.toStage) + 1}/4
        </span>
        <h2 id="evolve-title" className="text-center text-[28px] leading-tight font-extrabold">
          {characterName}에게
          <br />
          {fruit ? '열매가 맺혔어요!' : `${STAGE_LABEL[event.toStage]} 단계가 됐어요!`}
        </h2>
        <div className="rounded-full bg-[#FFF1C2] p-3">
          {fruit ? <FruitPlant size={170} /> : event.toStage === 'SPROUT' ? <SproutPot size={150} /> : <FlowerBurst size={130} />}
        </div>
        <p className="text-center text-sm leading-relaxed text-[#4A5145]">
          {caretakerName ? `${caretakerName} 님` : '관리사님'}과 함께 키운 덕분이에요.
          {fruit && (
            <>
              <br />곧 수확할 수 있어요.
            </>
          )}
        </p>
        <div className="flex gap-2">
          <span className="flex h-[30px] items-center rounded-full bg-blue-light px-3 text-[13px] font-bold text-blue">
            +{reward?.xpGained ?? event.reward?.xp ?? 0} XP
          </span>
          {(reward ? reward.badge?.name : event.reward?.badgeCode) && (
            <span className="flex h-[30px] items-center rounded-full bg-orange-light px-3 text-[13px] font-bold text-orange">
              새 배지 · {reward?.badge?.name ?? '첫 열매'}
            </span>
          )}
        </div>
        <button
          ref={closeRef}
          type="button"
          disabled={busy}
          onClick={() => close(fruit ? '/owner/harvest' : null)}
          className="mt-1.5 h-[54px] w-full rounded-2xl bg-leaf text-base font-extrabold text-white disabled:opacity-60"
        >
          {fruit ? '수확 날짜 보러 가기' : '좋아요'}
        </button>
        {fruit && (
          <button type="button" disabled={busy} onClick={() => close(null)} className="text-[13px] text-sub underline">
            나중에 볼게요
          </button>
        )}
      </div>
    </div>
  );
}