import { create } from 'zustand';

// 내 정보(/users/me)를 한 번 불러와 텃밭 ID 등을 여러 화면에서 같이 씀
export const useMeStore = create((set) => ({
  me: null,
  setMe: (me) => set({ me }),
  clearMe: () => set({ me: null }),
}));
