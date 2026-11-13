import { useCallback, useEffect, useRef } from 'react';

// 목업 모드 전용: 녹음하는 동안 브라우저 음성 인식으로 실제 말한 내용을 받아 둠
// (실제 서버 모드에서는 백엔드가 음성 파일로 STT를 하므로 쓰지 않음)
// 크롬·안드로이드·아이폰 사파리 지원. 지원하지 않으면 빈 문자열을 돌려줌.
export function useLiveTranscript(enabled) {
  const recRef = useRef(null);
  const textRef = useRef('');
  const endRef = useRef(null);

  const start = useCallback(() => {
    textRef.current = '';
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!enabled || !Recognition) return;
    try {
      const rec = new Recognition();
      rec.lang = 'ko-KR';
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        textRef.current = Array.from(e.results)
          .map((r) => r[0].transcript)
          .join(' ')
          .trim();
      };
      rec.onend = () => {
        recRef.current = null;
        endRef.current?.();
      };
      rec.onerror = () => {};
      rec.start();
      recRef.current = rec;
    } catch {
      recRef.current = null;
    }
  }, [enabled]);

  // 인식을 멈추고 마지막 결과까지 받은 뒤 글자를 돌려줌 (최대 1.5초 기다림)
  const finish = useCallback(
    () =>
      new Promise((resolve) => {
        const rec = recRef.current;
        if (!rec) {
          resolve(textRef.current);
          return;
        }
        const timer = setTimeout(() => resolve(textRef.current), 1500);
        endRef.current = () => {
          clearTimeout(timer);
          endRef.current = null;
          resolve(textRef.current);
        };
        try {
          rec.stop();
        } catch {
          clearTimeout(timer);
          resolve(textRef.current);
        }
      }),
    []
  );

  useEffect(
    () => () => {
      try {
        recRef.current?.abort();
      } catch {
        // 이미 멈춤
      }
    },
    []
  );

  return { start, finish };
}