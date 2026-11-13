import { useCallback, useEffect, useRef, useState } from 'react';

// 화면 진입 시 데이터를 불러오고, reload로 다시 부름 (폴링에서 재사용)
export function useAsync(fn, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fnRef = useRef(fn);

  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  const reload = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const result = await fnRef.current();
      setData(result);
      setError(null);
      return result;
    } catch (e) {
      if (!silent) setError(e);
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, setData, error, loading, reload };
}
