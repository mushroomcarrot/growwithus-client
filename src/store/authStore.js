// src/store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 데모 페이지 iframe(?demo=owner / ?demo=caretaker)은 두 계정이 섞이지 않게 메모리에만 저장
const isDemo = new URLSearchParams(window.location.search).has('demo');

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

export const useAuthStore = create(
  persist(
    (set) => ({
      userId: null,
      role: null, // 'USER' | 'OWNER' | 'CARETAKER'
      nextStep: null,
      accessToken: null,
      refreshToken: null,
      isDemo,
      login: ({ userId, role, nextStep, accessToken, refreshToken }) =>
        set({ userId, role, nextStep, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setRole: ({ role, nextStep, accessToken, refreshToken }) =>
        set({ role, nextStep, accessToken, refreshToken }),
      setNextStep: (nextStep) => set({ nextStep }),
      logout: () =>
        set({ userId: null, role: null, nextStep: null, accessToken: null, refreshToken: null }),
    }),
    {
      name: 'daesin-auth',
      storage: createJSONStorage(() => (isDemo ? memoryStorage : localStorage)),
    }
  )
);

export const isLoggedIn = () => Boolean(useAuthStore.getState().accessToken);