import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 데모 페이지(/demo, ADMIN)와 iframe(?demo=owner / ?demo=caretaker)은 같은 브라우저에서
// 세 계정을 동시에 쓰므로 localStorage를 공유하면 계정이 섞임 → 데모 모드는 메모리에만 저장
const params = new URLSearchParams(window.location.search);
export const demoAs = params.get('demo'); // 'owner' | 'caretaker' | null
const isDemo = window.location.pathname.startsWith('/demo') || Boolean(demoAs);

const memoryStorage = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value;
    },
    removeItem: (key) => {
      delete store[key];
    },
  };
})();

const empty = {
  userId: null,
  role: null, // 'USER' | 'OWNER' | 'CARETAKER' | 'ADMIN'
  nextStep: null,
  accessToken: null,
  refreshToken: null,
};

export const useAuthStore = create(
  persist(
    (set) => ({
      ...empty,
      isDemo,
      login: ({ userId, role, nextStep, accessToken, refreshToken }) =>
        set({ userId, role, nextStep, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      // 역할을 고르면 토큰이 새로 발급됨 (역할이 토큰에 들어가기 때문)
      setRole: ({ role, nextStep, accessToken, refreshToken }) =>
        set((state) => ({
          role,
          nextStep,
          accessToken: accessToken ?? state.accessToken,
          refreshToken: refreshToken ?? state.refreshToken,
        })),
      setNextStep: (nextStep) => set({ nextStep }),
      logout: () => set({ ...empty }),
    }),
    {
      name: 'daesin-auth',
      storage: createJSONStorage(() => (isDemo ? memoryStorage : localStorage)),
      partialize: ({ userId, role, nextStep, accessToken, refreshToken }) => ({
        userId,
        role,
        nextStep,
        accessToken,
        refreshToken,
      }),
    }
  )
);
