import { STAGES, STAGE_LABEL } from '../../utils/labels';
import { Flame, Star } from '../common/Icons';

export function StreakXp({ streak, xp }) {
  return (
    <div className="flex gap-1.5">
      <span className="flex h-[30px] items-center gap-1 rounded-full bg-orange-light px-2.5 text-[13px] font-bold text-orange" aria-label={`연속 응원 ${streak}일`}>
        <Flame />
        {streak}
      </span>
      <span className="flex h-[30px] items-center gap-1 rounded-full bg-blue-light px-2.5 text-[13px] font-bold text-blue" aria-label={`경험치 ${xp}`}>
        <Star />
        {xp.toLocaleString()}
      </span>
    </div>
  );
}

export function StageProgress({ stage, dDay }) {
  const index = STAGES.indexOf(stage);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-[13px] font-bold">
        <span>
          {STAGE_LABEL[stage]} 단계 · {index + 1}/4
        </span>
        <span className="text-[#B53A2E]">{dDay > 0 ? `수확까지 D-${dDay}` : '수확할 수 있어요'}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5" aria-hidden="true">
        {STAGES.map((s, i) => (
          <span key={s} className={`h-2 rounded ${i <= index ? 'bg-leaf' : 'bg-[#E4DFD3]'}`} />
        ))}
      </div>
      <div className="grid grid-cols-4 gap-1.5 text-center text-[11px] text-muted">
        {STAGES.map((s) => (
          <span key={s} className={s === stage ? 'font-bold text-leaf-dark' : ''}>
            {STAGE_LABEL[s]}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AiLine({ children, tone = 'green' }) {
  const toneClass = tone === 'blue' ? 'bg-[#EAF0F7] text-[#26405E]' : 'bg-leaf-soft text-[#3B4A36]';
  const badge = tone === 'blue' ? 'bg-blue' : 'bg-leaf';
  return (
    <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 ${toneClass}`}>
      <span className={`shrink-0 rounded-md ${badge} px-1.5 py-0.5 text-[11px] font-extrabold text-white`}>AI</span>
      <span className="text-xs leading-normal">{children}</span>
    </div>
  );
}
