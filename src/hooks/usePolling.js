import { useEffect, useRef } from 'react';

const DEFAULT_INTERVAL = Number(import.meta.env.VITE_POLLING_INTERVAL) || 4000;

// fn을 주기적으로 실행. 탭이 숨겨지면 멈추고, 다시 보이면 바로 한 번 실행함.
export function usePolling(fn, { interval = DEFAULT_INTERVAL, enabled = true } = {}) {
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    if (!enabled) return undefined;
    let timer = null;

    const tick = () => {
      if (!document.hidden) fnRef.current();
    };
    const start = () => {
      clearInterval(timer);
      timer = setInterval(tick, interval);
    };
    const onVisible = () => {
      if (!document.hidden) {
        tick();
        start();
      } else {
        clearInterval(timer);
      }
    };

    // 데모 패널에서 버튼을 누르면 바로 갱신 (같은 출처에서 온 메시지만)
    const onMessage = (e) => {
      if (e.origin === window.location.origin && e.data?.type === 'demo-refresh') fnRef.current();
    };

    start();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('message', onMessage);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('message', onMessage);
    };
  }, [interval, enabled]);
}
