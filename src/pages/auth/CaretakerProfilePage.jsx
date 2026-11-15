import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { farmService, profileService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useMeStore } from '../../store/ownerStore';
import { pathForNextStep } from '../../utils/nextStep';
import { BackButton } from '../../components/common/Layout';
import { FieldError } from '../../components/common/Feedback';
import { PrimaryButton, TextField } from '../../components/common/Form';
import ReadAloudButton from '../../components/common/ReadAloudButton';
import { CaretakerFace } from '../../components/common/Characters';
import { useUiStore } from '../../store/uiStore';

const AREA = {
  farm_theme: '처인구 원삼면',
  farm_clean: '처인구 원삼면 미평리',
  farm_forest: '처인구 원삼면 맹리',
};

function areaOf(farm) {
  return AREA[farm.farmId] ?? farm.address?.replace('경기도 용인시 ', '') ?? '';
}

export default function CaretakerProfilePage() {
  const navigate = useNavigate();
  const setNextStep = useAuthStore((s) => s.setNextStep);
  const clearMe = useMeStore((s) => s.clearMe);
  const { data: farms } = useAsync(() => farmService.getFarms(), []);
  const [name, setName] = useState('');
  const [farmId, setFarmId] = useState(null);
  const showToast = useUiStore((s) => s.showToast);
  const [photo, setPhoto] = useState(null);
  const [consent, setConsent] = useState(false);
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const farmList = farms?.items ?? [];
  const selectedFarm = farmId ?? farmList[0]?.farmId ?? null;

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!name.trim()) found.name = '성함을 적어 주세요.';
    if (!selectedFarm) found.farm = '일하실 농장을 골라 주세요.';
    if (photo && !consent) found.consent = '사진을 쓰려면 아래 동의에 표시해 주세요.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setLoading(true);
    setSubmitError('');
    try {
      const res = await profileService.createCaretakerProfile({ name: name.trim(), farmId: selectedFarm });
      // 얼굴 그림은 서버가 뒤에서 만듦. 실패해도 가입은 끝내고 기본 그림을 씀
      if (photo && consent) {
        try {
          await profileService.requestAvatar(photo);
          showToast('얼굴 그림을 만들고 있어요. 조금 뒤 가족 화면에 나와요');
        } catch {
          showToast('얼굴 그림은 나중에 다시 만들 수 있어요');
        }
      }
      setNextStep(res.nextStep);
      clearMe();
      navigate(pathForNextStep(res.nextStep, 'CARETAKER'), { replace: true });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-5 pt-11 pb-safe">
      <div className="flex items-center justify-between">
        <BackButton to="/role" label="역할 선택으로 돌아가기" large />
        <ReadAloudButton text="반가워요. 성함을 적고, 일하실 농장을 골라 주세요. 사진을 올리면 얼굴 그림도 만들어 드려요." />
      </div>
      <h1 className="mt-4 text-[28px] leading-snug font-extrabold">
        반가워요!
        <br />
        세 가지만 알려주세요
      </h1>

      <form onSubmit={submit} className="mt-6 flex flex-1 flex-col gap-6" noValidate>
        <TextField
          large
          label="1. 성함"
          name="name"
          autoComplete="name"
          placeholder="예: 이순자"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors({ ...errors, name: undefined });
          }}
          error={errors.name}
        />

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2 text-[19px] font-extrabold">2. 일하실 농장</legend>
          {farmList.map((farm) => {
            const selected = selectedFarm === farm.farmId;
            return (
              <button
                key={farm.farmId}
                type="button"
                aria-pressed={selected}
                onClick={() => setFarmId(farm.farmId)}
                className={`flex min-h-20 items-center gap-3 rounded-[18px] px-4 py-3 text-left ${
                  selected ? 'border-[3px] border-leaf bg-leaf-soft' : 'border-2 border-[#DDD6C6] bg-white'
                }`}
              >
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[19px] font-extrabold">{farm.name}</span>
                  <span className="text-[15px] text-[#4A5145]">{areaOf(farm)}</span>
                </span>
                {selected ? (
                  <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="#4C8C3F" />
                    <path d="M7 12l3.5 3.5L17 9" stroke="#FFFFFF" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span aria-hidden="true" className="h-[26px] w-[26px] shrink-0 rounded-full border-2 border-[#CFC8B8]" />
                )}
              </button>
            );
          })}
          <FieldError>{errors.farm}</FieldError>
        </fieldset>

        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2 text-[19px] font-extrabold">3. 내 얼굴 그림 (안 하셔도 돼요)</legend>
          <div className="flex items-center gap-3">
            {photo ? (
              <img
                src={preview}
                alt="고른 사진"
                className="h-[72px] w-[72px] shrink-0 rounded-2xl object-cover"
              />
            ) : (
              <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-2xl border-2 border-[#DDD6C6] bg-white">
                <CaretakerFace size={56} />
              </span>
            )}
            <label className="flex min-h-14 flex-1 cursor-pointer items-center justify-center rounded-[18px] border-2 border-[#DDD6C6] bg-white px-4 text-center text-[17px] font-extrabold">
              {photo ? '다른 사진 고르기' : '사진 찍거나 고르기'}
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="sr-only"
                onChange={(e) => {
                  setPhoto(e.target.files?.[0] ?? null);
                  setErrors({ ...errors, consent: undefined });
                }}
              />
            </label>
          </div>
          <p className="text-[15px] text-[#4A5145]">
            사진으로 AI가 얼굴 그림을 그려서 가족 화면에 보여 줘요. 사진은 그림을 만든 뒤 남기지 않아요.
          </p>
          {photo && (
            <label className="flex min-h-14 items-center gap-3 rounded-[18px] border-2 border-[#DDD6C6] bg-white px-4 py-3 text-[17px] font-bold">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setErrors({ ...errors, consent: undefined });
                }}
                className="h-6 w-6 shrink-0 accent-[#4C8C3F]"
              />
              내 사진으로 얼굴 그림을 만드는 데 동의해요
            </label>
          )}
          <FieldError>{errors.consent}</FieldError>
        </fieldset>

        <FieldError>{submitError}</FieldError>
        <div className="flex-1" />
        <p className="text-center text-[15px] text-[#4A5145]">자녀분이 대신 입력해 주셔도 돼요</p>
        <PrimaryButton large type="submit" disabled={loading}>
          {loading ? '저장하고 있어요' : '시작할게요'}
        </PrimaryButton>
      </form>
    </main>
  );
}
