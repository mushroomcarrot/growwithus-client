import { create } from 'zustand';

let timer = null;

export const useUiStore = create((set) => ({
  toast: '',
  showToast: (message, ms = 2500) => {
    clearTimeout(timer);
    set({ toast: message });
    timer = setTimeout(() => set({ toast: '' }), ms);
  },
  hideToast: () => {
    clearTimeout(timer);
    set({ toast: '' });
  },
}));
