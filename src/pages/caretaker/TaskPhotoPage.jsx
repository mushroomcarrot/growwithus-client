import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCamera } from '../../hooks/useCamera';
import { useTodayTask } from '../../hooks/useTodayTask';
import { taskService } from '../../services';
import { useCaretakerStore } from '../../store/caretakerStore';
import { useUiStore } from '../../store/uiStore';
import { compressImage } from '../../utils/image';
import { BackButton } from '../../components/common/Layout';
import { FieldError } from '../../components/common/Feedback';

const MAX_BYTES = 10 * 1024 * 1024;

function GuideCorners() {
  const corner = 'absolute h-10 w-10 border-white';
  return (
    <div aria-hidden="true" className="pointer-events-none absolute top-1/2 left-1/2 h-[300px] w-[250px] -translate-x-1/2 -translate-y-1/2">
      <span className={`${corner} top-0 left-0 rounded-tl-xl border-t-[5px] border-l-[5px]`} />
      <span className={`${corner} top-0 right-0 rounded-tr-xl border-t-[5px] border-r-[5px]`} />
      <span className={`${corner} bottom-0 left-0 rounded-bl-xl border-b-[5px] border-l-[5px]`} />
      <span className={`${corner} right-0 bottom-0 rounded-br-xl border-r-[5px] border-b-[5px]`} />
    </div>
  );
}

export default function TaskPhotoPage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { garden, task } = useTodayTask(taskId);
  const { videoRef, status, start, stop, capture } = useCamera();
  const setPhoto = useCaretakerStore((s) => s.setPhoto);
  const showToast = useUiStore((s) => s.showToast);
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null); // { blob, url }
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // 미리보기가 없을 때만 카메라를 켬 (다시 찍기 하면 video가 다시 그려진 뒤 켜짐)
  const showingPreview = Boolean(preview);
  useEffect(() => {
    if (showingPreview) return undefined;
    start();
    return () => stop();
  }, [showingPreview, start, stop]);

  useEffect(() => () => preview && URL.revokeObjectURL(preview.url), [preview]);

  const acceptPhoto = async (source) => {
    setError('');
    try {
      const blob = await compressImage(source, 1600, 0.85);
      if (blob.size > MAX_BYTES) {
        setError('사진이 너무 커요. 다시 찍어 주세요.');
        return;
      }
      setPreview({ blob, url: URL.createObjectURL(blob) });
    } catch {
      setError('사진을 불러오지 못했어요. 다시 찍어 주세요.');
    }
  };

  const onShutter = async () => {
    try {
      await acceptPhoto(await capture());
    } catch {
      setError('카메라가 아직 준비되지 않았어요. 잠시 후 다시 눌러 주세요.');
    }
  };

  const retake = () => setPreview(null);

  const upload = async () => {
    setUploading(true);
    setError('');
    try {
      const res = await taskService.uploadPhoto(taskId, preview.blob);
      setPhoto(res.photoId, res.photoUrl);
      if (res.aiCheck?.message) showToast(res.aiCheck.message);
      navigate(`/caretaker/tasks/${taskId}/voice`, { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 bg-[#161A15] px-5 pt-11 pb-safe text-white">
      <div className="flex items-center gap-2">
        <BackButton to="/caretaker" light />
        <span className="text-lg font-bold">
          {garden ? `${garden.plotCode} 밭 · ${task.title}` : '작업 인증 사진'}
        </span>
      </div>

      <div className="flex flex-col gap-1">
        <h1 className="text-[26px] font-extrabold">{preview ? '이 사진으로 올릴까요?' : '사진 한 장 찍어주세요'}</h1>
        {!preview && (
          <p className="text-lg leading-normal text-[#D6DCD2]">
            네모 안에 작물이 보이게
            <br />
            맞춰서 눌러주세요
          </p>
        )}
      </div>

      <div className="relative flex min-h-[360px] flex-1 items-center justify-center overflow-hidden rounded-3xl bg-[#3D4A33]">
        {preview ? (
          <img src={preview.url} alt="찍은 작업 사진" className="h-full w-full object-cover" />
        ) : (
          <>
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover" />
            {status === 'ready' && <GuideCorners />}
            {status === 'starting' && <p className="text-lg text-[#D6DCD2]">카메라를 켜고 있어요</p>}
            {status === 'unavailable' && (
              <p className="px-6 text-center text-lg leading-relaxed text-[#D6DCD2]">
                카메라를 열 수 없어요.
                <br />
                아래 버튼으로 사진을 골라 주세요.
              </p>
            )}
          </>
        )}
      </div>

      <FieldError>{error}</FieldError>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && acceptPhoto(e.target.files[0])}
      />

      {preview ? (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={upload}
            disabled={uploading}
            className="h-[68px] rounded-[20px] bg-leaf text-[22px] font-extrabold text-white disabled:opacity-60"
          >
            {uploading ? '올리고 있어요' : '이 사진 올리기'}
          </button>
          <button
            type="button"
            onClick={retake}
            disabled={uploading}
            className="h-14 rounded-[20px] bg-white/15 text-lg font-bold"
          >
            다시 찍기
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3.5">
          {status === 'unavailable' ? (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="h-[68px] w-full rounded-[20px] bg-leaf text-[22px] font-extrabold text-white"
            >
              사진 찍기
            </button>
          ) : (
            <button
              type="button"
              aria-label="사진 찍기"
              onClick={onShutter}
              disabled={status !== 'ready'}
              className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-[5px] border-white disabled:opacity-50"
            >
              <span className="h-[68px] w-[68px] rounded-full bg-white" />
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(`/caretaker/tasks/${taskId}/voice`, { replace: true })}
            className="text-[17px] font-bold text-[#D6DCD2] underline underline-offset-4"
          >
            사진 없이 할게요
          </button>
        </div>
      )}
    </main>
  );
}
