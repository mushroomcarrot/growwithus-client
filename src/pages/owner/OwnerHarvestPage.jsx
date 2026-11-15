import { useCallback, useState } from 'react';
import { useAsync } from '../../hooks/useAsync';
import { givenName, useMe } from '../../hooks/useMe';
import { harvestService } from '../../services';
import { useUiStore } from '../../store/uiStore';
import { formatHourLabel, formatMonthDay, weekdayName } from '../../utils/format';
import { STAGE_LABEL } from '../../utils/labels';
import { FruitPlant } from '../../components/common/Characters';
import { ErrorBox, FieldError, LoadingSpinner } from '../../components/common/Feedback';
import { IconFork, IconSprout } from '../../components/common/Icons';
import CropCharacter from '../../components/owner/CropCharacter';
import { harvestLabel } from '../../components/owner/OwnerParts';

export default function OwnerHarvestPage() {
  const { gardenId } = useMe();
  const showToast = useUiStore((s) => s.showToast);
  const [slotId, setSlotId] = useState(null);
  const [reserving, setReserving] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!gardenId) return null;
    const [harvest, slots, outings] = await Promise.all([
      harvestService.getHarvest(gardenId),
      harvestService.getVisitSlots(gardenId),
      harvestService.getOutings(gardenId).catch(() => []),
    ]);
    return { harvest, slots, outings };
  }, [gardenId]);

  const { data, error: loadError, reload } = useAsync(load, [gardenId]);

  if (loadError && !data) return <ErrorBox message={loadError.message} onRetry={reload} />;
  if (!gardenId || !data) return <LoadingSpinner />;

  const { harvest, slots, outings } = data;
  const available = slots.filter((s) => s.available);
  // 서버가 내려준 기존 예약. 다시 들어와도 그대로 보임
  const reserved = harvest.visit?.status === 'RESERVED' ? harvest.visit : null;
  const reservedSlotId = reserved
    ? slots.find((s) => s.date === reserved.date && s.startTime === reserved.startTime)?.slotId
    : null;
  const selectedId = reservedSlotId ?? slotId ?? available[0]?.slotId ?? null;
  const selected = slots.find((s) => s.slotId === selectedId);
  const hasDate = Boolean(harvest.expectedDate);
  // 수확 가능 여부는 서버 기준만 따름 (관리사가 열매를 확인해야 true)
  const ready = Boolean(harvest.harvestable);
  const soon = !ready && harvest.dDay != null && harvest.dDay <= 7;
  const expectedDay = hasDate ? weekdayName(harvest.expectedDate) : '주말';

  const reserve = async () => {
    if (!selected) return;
    setReserving(true);
    setError('');
    try {
      const res = await harvestService.reserveVisit({ gardenId, slotId: selected.slotId });
      setSlotId(selected.slotId);
      showToast(`${weekdayName(res.date)} ${formatHourLabel(res.startTime)}로 예약됐어요`);
      await reload({ silent: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setReserving(false);
    }
  };

  const cancel = async () => {
    if (!reserved) return;
    setCanceling(true);
    setError('');
    try {
      await harvestService.cancelVisit(reserved.visitId);
      setSlotId(null);
      showToast('방문 예약을 취소했어요');
      await reload({ silent: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setCanceling(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col">
      <section className="flex flex-col items-center gap-1.5 bg-sun px-5 pt-12 pb-5">
        <span className="text-xs font-bold text-[#6B4A07]">
          {STAGE_LABEL[harvest.stage] ? `${STAGE_LABEL[harvest.stage]} 단계 · ` : ''}
          {harvestLabel(harvest.dDay)}
        </span>
        <h1 className="text-center text-[26px] font-extrabold">
          {ready
            ? `이번 ${expectedDay}, 수확해요!`
            : hasDate
              ? `${formatMonthDay(harvest.expectedDate)}쯤 수확해요`
              : '수확일을 계산하고 있어요'}
        </h1>
        {soon && <p className="text-center text-xs font-bold text-[#6B4A07]">관리사님이 열매를 확인하면 바로 알려드릴게요</p>}
        {harvest.stage === 'FRUIT' || ready ? <FruitPlant size={160} /> : <CropCharacter stage={harvest.stage ?? 'FLOWER'} animation="sunny_happy" />}
        <p className="text-center text-xs leading-normal text-[#5E5233]">
          AI 예측 수확일까지 {givenName(harvest.caretakerName)} 님이
          <br />
          {harvest.daysCaredTogether}일을 함께 돌봐주셨어요
        </p>
      </section>

      <div className="flex flex-1 flex-col gap-3 px-5 pt-5 pb-4">
        <h2 className="text-[15px] font-extrabold">방문 시간 고르기</h2>
        {slots.length === 0 ? (
          <p className="text-sm text-sub">아직 열린 방문 시간이 없어요.</p>
        ) : (
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="방문 시간">
            {slots.map((slot) => {
              const isSelected = slot.slotId === selectedId;
              return (
                <button
                  key={slot.slotId}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={!slot.available || Boolean(reserved)}
                  onClick={() => setSlotId(slot.slotId)}
                  className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-[14px] ${
                    isSelected ? 'border-2 border-leaf bg-[#EEF6E8]' : 'border border-[#DDD6C6] bg-white'
                  } disabled:opacity-45`}
                >
                  <span className="text-[11px] text-[#3B4A36]">{weekdayName(slot.date)}</span>
                  <span className={`text-sm ${isSelected ? 'font-extrabold text-leaf-dark' : 'font-bold'}`}>
                    {slot.available || isSelected ? formatHourLabel(slot.startTime) : '마감'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {outings.length > 0 && (
          <>
            <h2 className="mt-2 text-[15px] font-extrabold">수확하고 처인 나들이</h2>
            <div className="grid grid-cols-2 gap-2">
              {outings.map((o) => (
                <div key={o.name} className="flex flex-col gap-1.5 rounded-[14px] border border-line bg-white p-3">
                  <span className={o.type === 'RESTAURANT' ? 'text-orange' : 'text-[#3E7A33]'}>
                    {o.type === 'RESTAURANT' ? <IconFork /> : <IconSprout />}
                  </span>
                  <span className="text-[13px] font-bold">{o.name}</span>
                  <span className="text-[11px] text-muted">
                    {o.description}
                    {o.distanceKm ? ` · ${o.distanceKm}km` : ''}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <FieldError>{error}</FieldError>
        <div className="flex-1" />
        {reserved ? (
          <div className="flex flex-col gap-2">
            <div className="rounded-2xl bg-leaf-soft px-4 py-3.5 text-center text-[15px] font-bold text-leaf-dark" role="status">
              {formatMonthDay(reserved.date)} {weekdayName(reserved.date)} {formatHourLabel(reserved.startTime)} 방문 예약 완료
            </div>
            <button
              type="button"
              onClick={cancel}
              disabled={canceling}
              className="h-11 rounded-2xl border-[1.5px] border-[#DDD6C6] bg-white text-sm font-bold text-sub disabled:opacity-50"
            >
              {canceling ? '취소하고 있어요' : '예약 취소하기'}
            </button>
            <p className="text-center text-[11px] text-muted">방문 하루 전까지 취소할 수 있어요</p>
          </div>
        ) : (
          <button
            type="button"
            onClick={reserve}
            disabled={!selected || reserving}
            className="h-14 rounded-2xl bg-leaf text-base font-extrabold text-white disabled:opacity-50"
          >
            {reserving ? '예약하고 있어요' : '주말 방문 예약하기'}
          </button>
        )}
      </div>
    </main>
  );
}