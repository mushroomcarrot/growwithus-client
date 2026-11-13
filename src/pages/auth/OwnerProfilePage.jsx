import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAsync } from '../../hooks/useAsync';
import { givenName } from '../../hooks/useMe';
import { farmService, profileService } from '../../services';
import { useAuthStore } from '../../store/authStore';
import { useMeStore } from '../../store/ownerStore';
import { DISTRICT_LABEL } from '../../utils/labels';
import { pathForNextStep } from '../../utils/nextStep';
import { BackButton } from '../../components/common/Layout';
import { FieldError } from '../../components/common/Feedback';
import { PrimaryButton, TextField } from '../../components/common/Form';
import CaretakerAvatar from '../../components/common/CaretakerAvatar';

// API가 SUJI, GIHEUNG만 받음 (처인구 추가 여부는 백엔드와 협의 중)
const DISTRICTS = ['SUJI', 'GIHEUNG'];

export default function OwnerProfilePage() {
  const navigate = useNavigate();
  const setNextStep = useAuthStore((s) => s.setNextStep);
  const clearMe = useMeStore((s) => s.clearMe);
  const { data: farms } = useAsync(() => farmService.getFarms(), []);
  const [form, setForm] = useState({ nickname: '', district: 'SUJI', farmId: '', plotCode: '' });
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState('');
  const [checking, setChecking] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [loading, setLoading] = useState(false);

  const farmList = farms?.items ?? [];
  const farmId = form.farmId || farmList[0]?.farmId || '';

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
    if (key === 'plotCode' || key === 'farmId') {
      setPreview(null);
      setPreviewError('');
    }
  };

  const checkPlot = async () => {
    if (!form.plotCode.trim()) {
      setPreviewError('칸 번호를 입력해 주세요.');
      return;
    }
    setChecking(true);
    setPreviewError('');
    try {
      setPreview(await farmService.previewPlot(farmId, form.plotCode));
    } catch (e) {
      setPreview(null);
      setPreviewError(e.message);
    } finally {
      setChecking(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    const nickname = form.nickname.trim();
    if (!nickname || nickname.length > 20) found.nickname = '가족 이름을 1~20자로 입력해 주세요.';
    if (!preview) found.plot = '칸 번호를 입력하고 확인을 눌러 주세요.';
    setErrors(found);
    if (Object.keys(found).length) return;
    setLoading(true);
    setSubmitError('');
    try {
      const res = await profileService.createOwnerProfile({
        nickname,
        district: form.district,
        farmId,
        plotCode: preview.plotCode,
      });
      setNextStep(res.nextStep);
      clearMe();
      navigate(pathForNextStep(res.nextStep, 'OWNER'), { replace: true });
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-6 pt-11 pb-safe">
      <div className="flex items-center justify-between">
        <BackButton to="/role" label="역할 선택으로 돌아가기" />
        <span className="text-xs font-bold text-[#C2453A]">텃밭 주인</span>
      </div>
      <h1 className="mt-4 mb-1 text-2xl font-extrabold">우리 가족을 소개해 주세요</h1>
      <p className="text-[13px] text-sub">텃밭 칸 번호를 넣으면 담당 관리사님이 바로 연결돼요</p>

      <form onSubmit={submit} className="mt-5 flex flex-1 flex-col gap-4" noValidate>
        <TextField
          label="가족 이름"
          name="nickname"
          placeholder="예: 민지네 가족"
          value={form.nickname}
          onChange={(e) => update('nickname', e.target.value)}
          error={errors.nickname}
        />

        <fieldset className="flex flex-col gap-1.5">
          <legend className="mb-1.5 text-sm font-bold">사는 곳</legend>
          <div className="grid grid-cols-2 gap-2">
            {DISTRICTS.map((d) => {
              const selected = form.district === d;
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update('district', d)}
                  className={`h-11 rounded-xl text-sm ${
                    selected ? 'border-2 border-leaf bg-[#EEF6E8] font-extrabold text-leaf-dark' : 'border border-[#DDD6C6] bg-white'
                  }`}
                >
                  {DISTRICT_LABEL[d]}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-bold">내 텃밭</span>
          <div className="flex gap-2">
            <label className="flex min-w-0 flex-1 flex-col gap-1 text-[11px] text-sub">
              농장
              <select
                value={farmId}
                onChange={(e) => update('farmId', e.target.value)}
                className="h-[50px] rounded-[14px] border-[1.5px] border-[#D9D3C4] bg-white px-3 text-sm text-ink"
              >
                {farmList.map((f) => (
                  <option key={f.farmId} value={f.farmId}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex w-24 shrink-0 flex-col gap-1 text-[11px] text-sub">
              칸 번호
              <input
                value={form.plotCode}
                onChange={(e) => update('plotCode', e.target.value.toUpperCase())}
                placeholder="B-17"
                autoCapitalize="characters"
                className="h-[50px] rounded-[14px] border-[1.5px] border-[#D9D3C4] bg-white px-3 text-[15px] text-ink"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={checkPlot}
            disabled={checking || !farmId}
            className="mt-1 h-11 rounded-xl border-[1.5px] border-leaf bg-white text-sm font-bold text-leaf-dark disabled:opacity-50"
          >
            {checking ? '확인하고 있어요' : '칸 번호 확인'}
          </button>
          <FieldError>{previewError || errors.plot}</FieldError>
          {preview && (
            <div className="mt-1 flex items-center gap-2.5 rounded-xl bg-leaf-soft px-3 py-2.5" role="status">
              <CaretakerAvatar avatarUrl={preview.caretaker?.avatarUrl} size={34} name={preview.caretaker?.name} />
              <span className="text-xs leading-normal text-[#2F4A2A]">
                {preview.plotCode} {preview.crop.name} “{preview.crop.characterName}” · 담당 관리사{' '}
                <b>{givenName(preview.caretaker?.name)} 님</b>
                <br />월 이용료 {preview.monthlyFee.toLocaleString()}원 (가정)
              </span>
            </div>
          )}
        </div>

        <FieldError>{submitError}</FieldError>
        <div className="flex-1" />
        <PrimaryButton type="submit" disabled={loading}>
          {loading ? '텃밭을 만들고 있어요' : '텃밭 시작하기'}
        </PrimaryButton>
      </form>
    </main>
  );
}
