import { useCallback, useEffect, useRef, useState } from 'react';
import { ttsService } from '../services';

// 서버 /tts로 읽어주고, 실패하면 브라우저 음성(speechSynthesis)으로 대신 읽음
export function useSpeech() {
  const audioRef = useRef(null);
  const cacheRef = useRef(new Map());
  const [speaking, setSpeaking] = useState(false);

  const stop = useCallback(() => {
    audioRef.current?.pause();
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const speakWithBrowser = useCallback((text) => {
    if (!window.speechSynthesis) {
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'ko-KR';
    utter.rate = 0.9;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, []);

  const speak = useCallback(
    async (text) => {
      if (!text) return;
      stop();
      setSpeaking(true);
      try {
        let url = cacheRef.current.get(text);
        if (!url) {
          const blob = await ttsService.speak(text);
          url = URL.createObjectURL(blob);
          cacheRef.current.set(text, url);
        }
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setSpeaking(false);
        audio.onerror = () => speakWithBrowser(text);
        await audio.play();
      } catch {
        speakWithBrowser(text);
      }
    },
    [speakWithBrowser, stop]
  );

  useEffect(() => {
    const cache = cacheRef.current;
    return () => {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
      cache.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  return { speak, stop, speaking };
}
