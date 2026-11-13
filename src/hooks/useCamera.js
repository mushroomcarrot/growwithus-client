import { useCallback, useEffect, useRef, useState } from 'react';

// 후면 카메라 미리보기 + 캡처. 권한 거부·미지원이면 status가 'unavailable'이 됨.
export function useCamera() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | starting | ready | unavailable

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('unavailable');
      return;
    }
    setStatus('starting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setStatus('ready');
    } catch {
      setStatus('unavailable');
    }
  }, []);

  // 현재 화면을 JPEG Blob으로 캡처
  const capture = useCallback(
    () =>
      new Promise((resolve, reject) => {
        const video = videoRef.current;
        if (!video || !video.videoWidth) {
          reject(new Error('카메라가 준비되지 않았어요'));
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0);
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('캡처 실패'))), 'image/jpeg', 0.9);
      }),
    []
  );

  useEffect(() => stop, [stop]);

  return { videoRef, status, start, stop, capture };
}
