import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRecorder } from '../../hooks/useRecorder';
import { useLiveTranscript } from '../../hooks/useLiveTranscript';
import { USE_MOCK } from '../../services/mock';
import { useTodayTask } from '../../hooks/useTodayTask';
import { taskService } from '../../services';
import { useCaretakerStore } from '../../store/caretakerStore';
import { issueLabel } from '../../utils/labels';
import { BackButton } from '../../components/common/Layout';
import { FieldError, LoadingSpinner } from '../../components/common/Feedback';
import ReadAloudButton from '../../components/common/ReadAloudButton';
import { IconMic } from '../../components/common/Icons';

const formatSec = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

function Waveform() {
  const bars = [8, 16, 24, 12, 20, 8, 16, 28, 12, 20, 8, 16, 8, 20, 12, 16, 8, 24, 12, 8];
  return (
    <svg width="190" height="28" viewBox="0 0 190 28" aria-hidden="true">
      {bars.map((h, i) => (
        <rect key={i} x={i * 8} y={(28 - h) / 2} width="4" height={h} rx="2" fill={i < 12 ? '#4C8C3F' : '#CFC8B8'} />
      ))}
    </svg>
  );
}

export default function TaskVoicePage() {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const { garden, task } = useTodayTask(taskId);
  const recorder = useRecorder();
  const live = useLiveTranscript(USE_MOCK);
  const setVoiceMemoId = useCaretakerStore((s) => s.setVoiceMemoId);
  const [phase, setPhase] = useState('idle'); // idle | uploading | result
  const [memo, setMemo] = useState(null);
  const [summary, setSummary] = useState('');
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const goDone = () => navigate(`/caretaker/tasks/${taskId}/done`, { replace: true });

  // 녹음이 끝나면 바로 업로드해서 AI 정리를 받음
  useEffect(() => {
    if (recorder.status !== 'done' || !recorder.result) return;
    let cancelled = false;
    (async () => {
      setPhase('uploading');
      setError('');
      try {
        const spoken = USE_MOCK ? await live.finish() : undefined;
        if (cancelled) return;
        const res = await taskService.uploadVoice(taskId, recorder.result.blob, recorder.result.fileName, spoken);
        if (cancelled) return;
        setMemo(res);
        setSummary(res.summary);
        setPhase('result');
      } catch (e) {
        if (cancelled) return;
        setError(e.message);
        setPhase('idle');
        recorder.reset();
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recorder.status, recorder.result, taskId]);

  const confirm = async () => {
    setSending(true);
    setError('');
    try {
      const edited = summary.trim() && summary.trim() !== memo.summary ? summary.trim() : undefined;
      await taskService.confirmVoice(memo.voiceMemoId, edited);
      setVoiceMemoId(memo.voiceMemoId);
      goDone();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const again = () => {
    setMemo(null);
    setEditing(false);
    setPhase('idle');
    recorder.reset();
  };

  const header = (
    <div className="flex items-center gap-2">
      <BackButton to="/caretaker" />
      <span className="text-lg font-bold">{garden ? `${garden.plotCode} 밭 · 말로 남기기` : '말로 남기기'}</span>
    </div>
  );

  if (phase === 'uploading') {
    return (
      <main className="flex flex-1 flex-col px-5 pt-11 pb-safe">
        {header}
        <LoadingSpinner large label="말씀을 정리하고 있어요" />
      </main>
    );
  }

  if (phase === 'result' && memo) {
    const issues = memo.issues ?? [];
    return (
      <main className="flex flex-1 flex-col gap-3.5 px-5 pt-11 pb-safe">
        {header}
        <h1 className="text-[26px] font-extrabold">잘 들었어요</h1>

        <section className="flex flex-col gap-2.5 rounded-[18px] bg-white px-4 py-3.5 shadow-[0_2px_10px_rgba(60,50,30,0.08)]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-leaf-light text-leaf-dark">
              <IconMic size={20} />
            </span>
            <Waveform />
            <span className="text-[15px] font-bold text-[#4A5145]">{formatSec(recorder.seconds)}</span>
          </div>
          {memo.transcript ? (
            <p className="text-[17px] leading-relaxed text-[#3B3424]">“{memo.transcript}”</p>
          ) : (
            <p className="text-base text-sub">말씀이 잘 안 들렸어요</p>
          )}
        </section>

        <section className="flex flex-col gap-3 rounded-[18px] border-2 border-[#BFD9AE] bg-leaf-soft p-4">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="rounded-md bg-leaf px-[7px] py-0.5 text-xs font-extrabold text-white">AI</span>
              <span className="text-[17px] font-extrabold">이렇게 정리했어요</span>
            </span>
            <ReadAloudButton text={summary} label="듣기" />
          </div>
          <div className="flex items-center justify-between text-[17px]">
            <span className="text-[#4A5145]">작업</span>
            <span className="font-extrabold text-leaf-dark">{task ? `${task.title} 완료` : '완료'}</span>
          </div>
          <div className="flex items-start justify-between gap-3 text-[17px]">
            <span className="shrink-0 text-[#4A5145]">이상한 점</span>
            <span className="text-right font-extrabold">
              {issues.length ? issues.map(issueLabel).join(', ') : '없음'}
            </span>
          </div>
          <div className="h-px bg-[#D3E4C6]" />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#4A5145]">가족에게 이렇게 전해요</span>
            <button type="button" onClick={() => setEditing((v) => !v)} className="text-sm font-bold text-leaf-dark underline">
              {editing ? '고치기 끝' : '문장 고치기'}
            </button>
          </div>
          {editing ? (
            <label className="flex flex-col gap-1">
              <span className="sr-only">가족에게 보낼 문장</span>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                maxLength={200}
                className="rounded-xl border-[1.5px] border-[#CFC8B8] bg-white p-3 text-base leading-normal"
              />
            </label>
          ) : (
            <p className="text-base leading-normal font-medium">“{summary}”</p>
          )}
        </section>

        <FieldError>{error}</FieldError>
        <div className="flex-1" />
        <button
          type="button"
          onClick={confirm}
          disabled={sending || !summary.trim()}
          className="h-[68px] rounded-[20px] bg-leaf text-[22px] font-extrabold text-white shadow-[0_4px_0_#3A6E30] disabled:opacity-60"
        >
          {sending ? '보내고 있어요' : '맞아요, 보낼게요'}
        </button>
        <button
          type="button"
          onClick={again}
          disabled={sending}
          className="flex h-[60px] items-center justify-center gap-2.5 rounded-[20px] bg-white text-[19px] font-extrabold shadow-[0_2px_10px_rgba(60,50,30,0.1)]"
        >
          <IconMic size={22} />
          다시 말하기
        </button>
      </main>
    );
  }

  const recording = recorder.status === 'recording';
  const startRecording = async () => {
    await recorder.start();
    live.start();
  };
  return (
    <main className="flex flex-1 flex-col gap-4 px-5 pt-11 pb-safe">
      {header}
      <h1 className="text-[26px] leading-snug font-extrabold">
        {recording ? '듣고 있어요' : '말로 남겨 주세요'}
      </h1>
      <p className="text-lg leading-relaxed text-[#4A5145]">
        {recording
          ? '다 말씀하시면 아래 버튼을 눌러 주세요.'
          : '오늘 텃밭이 어땠는지 편하게 말씀해 주세요. AI가 가족에게 보낼 문장으로 정리해 드려요.'}
      </p>

      <div className="flex flex-1 flex-col items-center justify-center gap-5">
        {recorder.status === 'unavailable' ? (
          <p className="px-4 text-center text-lg leading-relaxed text-[#4A5145]">
            마이크를 쓸 수 없어요.
            <br />
            휴대폰 설정에서 마이크를 허용해 주세요.
          </p>
        ) : (
          <>
            <button
              type="button"
              onClick={recording ? recorder.stop : startRecording}
              aria-label={recording ? '녹음 그만하기' : '녹음 시작하기'}
              className={`flex h-[140px] w-[140px] items-center justify-center rounded-full text-white ${
                recording ? 'animate-pulse-ring bg-tomato' : 'bg-leaf shadow-[0_6px_0_#3A6E30]'
              }`}
            >
              {recording ? <span className="h-11 w-11 rounded-lg bg-white" /> : <IconMic size={60} />}
            </button>
            <span className="text-xl font-bold" aria-live="polite">
              {recording
                ? `${formatSec(recorder.seconds)} / ${formatSec(recorder.maxSeconds)}`
                : '눌러서 말하기'}
            </span>
          </>
        )}
      </div>

      <FieldError>{error}</FieldError>
      {recording ? (
        <button
          type="button"
          onClick={recorder.stop}
          className="h-[68px] rounded-[20px] bg-leaf text-[22px] font-extrabold text-white shadow-[0_4px_0_#3A6E30]"
        >
          다 말했어요
        </button>
      ) : (
        <button
          type="button"
          onClick={goDone}
          className="h-[60px] rounded-[20px] bg-white text-[19px] font-extrabold shadow-[0_2px_10px_rgba(60,50,30,0.1)]"
        >
          말 없이 완료할게요
        </button>
      )}
    </main>
  );
}