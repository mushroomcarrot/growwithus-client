import { useCallback, useEffect, useState } from 'react';
import { userService } from '../services';
import { useMeStore } from '../store/ownerStore';

export function useMe() {
  const me = useMeStore((s) => s.me);
  const setMe = useMeStore((s) => s.setMe);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    try {
      const data = await userService.getMe();
      setMe(data);
      setError(null);
      return data;
    } catch (e) {
      setError(e);
      return null;
    }
  }, [setMe]);

  useEffect(() => {
    if (!me) reload();
  }, [me, reload]);

  return { me, error, reload, gardenId: me?.owner?.gardenId ?? null };
}

// '박순자' → '순자' (세 글자 이름이면 성을 뺌)
export function givenName(name = '') {
  return name.length === 3 ? name.slice(1) : name;
}
