import { useState } from 'react';
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
import { CARETAKER_CHARACTERS, CaretakerFace } from '../../components/common/Characters';

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
  const [characterId, setCharacterId] = useState(CARETAKER_CHARACTERS[0].id);
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
    setErrors(found);
    if (Object.keys(found).length) return;
    setLoading(true);
    setSubmitError('');
    try {
      const res = await profileService.createCaretakerProfile({ name: name.trim(), farmId: selectedFarm, characterId });
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
        <ReadAloudButton text="반가워요. 성함을 적고, 일하실 농장과 얼굴 그림을 골라 주세요." />
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
          <legend className="mb-2 text-[19px] font-extrabold">3. 내 얼굴 그림</legend>
          <div className="grid grid-cols-4 gap-2">
            {CARETAKER_CHARACTERS.map((c) => {
              const selected = characterId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={selected}
                  aria-label={c.label}
                  onClick={() => setCharacterId(c.id)}
                  className={`flex aspect-square items-center justify-center rounded-2xl ${
                    selected ? 'border-[3px] border-leaf bg-leaf-soft' : 'border-2 border-[#DDD6C6] bg-white'
                  }`}
                >
                  <CaretakerFace characterId={c.id} size={56} />
                </button>
              );
            })}
          </div>
          <p className="text-[15px] text-[#4A5145]">가족 화면에 이 그림이 나와요</p>
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
