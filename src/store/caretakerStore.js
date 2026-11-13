import { create } from 'zustand';

// 관리사 작업 1건이 사진 → 말로 남기기 → 완료 화면을 거치는 동안 결과를 들고 다님
export const useCaretakerStore = create((set) => ({
  taskId: null,
  photoId: null,
  photoUrl: null,
  voiceMemoId: null,
  startTask: (taskId) =>
    set((state) =>
      state.taskId === taskId ? state : { taskId, photoId: null, photoUrl: null, voiceMemoId: null }
    ),
  setPhoto: (photoId, photoUrl) => set({ photoId, photoUrl }),
  setVoiceMemoId: (voiceMemoId) => set({ voiceMemoId }),
  resetTask: () => set({ taskId: null, photoId: null, photoUrl: null, voiceMemoId: null }),
}));
