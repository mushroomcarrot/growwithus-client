import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 60;

// 아이폰 사파리는 mp4, 크롬·안드로이드는 webm으로 녹음됨 (백엔드가 둘 다 받음)
function pickMimeType() {
  if (typeof MediaRecorder === 'undefined') return null;
  const candidates = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm'];
  return candidates.find((t) => MediaRecorder.isTypeSupported(t)) ?? '';
}

export function useRecorder() {
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | recording | done | unavailable
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState(null); // { blob, fileName }

  const cleanup = useCallback(() => {
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const stop = useCallback(() => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  }, []);

  const start = useCallback(async () => {
    const mimeType = pickMimeType();
    if (mimeType === null || !navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const type = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type });
        const ext = type.includes('mp4') ? 'm4a' : 'webm';
        setResult({ blob, fileName: `voice.${ext}` });
        setStatus('done');
        cleanup();
      };
      recorder.start();
      setSeconds(0);
      setResult(null);
      setStatus('recording');
      const startedAt = Date.now();
      timerRef.current = setInterval(() => {
        const s = Math.floor((Date.now() - startedAt) / 1000);
        setSeconds(s);
        if (s >= MAX_SECONDS) stop();
      }, 250);
    } catch {
      cleanup();
      setStatus('unavailable');
    }
  }, [cleanup, stop]);

  const reset = useCallback(() => {
    setResult(null);
    setSeconds(0);
    setStatus('idle');
  }, []);

  useEffect(
    () => () => {
      if (recorderRef.current?.state === 'recording') {
        recorderRef.current.onstop = null;
        recorderRef.current.stop();
      }
      cleanup();
    },
    [cleanup]
  );

  return { status, seconds, result, start, stop, reset, maxSeconds: MAX_SECONDS };
}
