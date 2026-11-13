// 모든 API 호출은 여기 있는 서비스로만 함. VITE_USE_MOCK=true면 mocks/mockApi.js가 대신 응답함.
import { apiClient } from './apiClient';
import { USE_MOCK } from './mock';
import {
  mockAuth,
  mockDemo,
  mockDiary,
  mockFarm,
  mockHarvest,
  mockHome,
  mockProfile,
  mockQuest,
  mockTask,
  mockUser,
} from '../mocks/mockApi';
import { blobToDataUrl } from '../utils/image';

const pick = (mock, real) => (USE_MOCK ? mock : real);

export const authService = pick(mockAuth, {
  signup: (body) => apiClient.post('/auth/signup', body),
  checkUsername: (username) => apiClient.get('/auth/username-check', { params: { username } }),
  login: (body) => apiClient.post('/auth/login', body),
  logout: () => apiClient.post('/auth/logout'),
});

export const userService = pick(mockUser, {
  getMe: () => apiClient.get('/users/me'),
  setRole: (role) => apiClient.put('/users/me/role', { role }),
});

export const farmService = pick(mockFarm, {
  getFarms: (params = {}) => apiClient.get('/farms', { params: { district: 'CHEOIN', limit: 20, ...params } }),
  previewPlot: (farmId, plotCode) =>
    apiClient.get(`/farms/${farmId}/plots/${encodeURIComponent(plotCode.trim().toUpperCase())}`),
});

export const profileService = pick(mockProfile, {
  createOwnerProfile: (body) => apiClient.post('/owners/me/profile', body),
  updateOwnerProfile: (body) => apiClient.patch('/owners/me/profile', body),
  // characterId는 백엔드 필드 확정 전이라 서버가 무시해도 동작함
  createCaretakerProfile: (body) => apiClient.post('/caretakers/me/profile', body),
});

export const homeService = pick(mockHome, {
  getHome: (gardenId) => apiClient.get(`/gardens/${gardenId}/home`),
  cheer: (gardenId) => apiClient.post(`/gardens/${gardenId}/cheers`),
  sendHeart: (careLogId) => apiClient.post(`/care-logs/${careLogId}/hearts`),
  getEvents: (gardenId) => apiClient.get(`/gardens/${gardenId}/events`),
  ackEvent: (eventId) => apiClient.post(`/events/${eventId}/ack`),
});

export const diaryService = pick(mockDiary, {
  getDiary: (gardenId, filter = 'ALL', cursor) =>
    apiClient.get(`/gardens/${gardenId}/diary`, { params: { filter, cursor, limit: 20 } }),
});

export const questService = pick(mockQuest, {
  getWeekly: () => apiClient.get('/quests/weekly'),
  claim: (questId) => apiClient.post(`/quests/${questId}/claim`),
});

export const harvestService = pick(mockHarvest, {
  getHarvest: (gardenId) => apiClient.get(`/gardens/${gardenId}/harvest`),
  getVisitSlots: (gardenId) => apiClient.get(`/gardens/${gardenId}/visit-slots`),
  // headcount는 선택값이라 보내지 않음
  reserveVisit: ({ gardenId, slotId }) => apiClient.post('/visits', { gardenId, slotId }),
  getOutings: (gardenId) => apiClient.get(`/gardens/${gardenId}/outings`),
});

export const taskService = USE_MOCK
  ? {
      ...mockTask,
      uploadPhoto: async (taskId, blob) => mockTask.uploadPhoto(taskId, await blobToDataUrl(blob)),
      // 목업은 브라우저 음성 인식 결과(spoken)로 정리함
      uploadVoice: (taskId, _blob, _fileName, spoken) => mockTask.uploadVoice(taskId, spoken),
    }
  : {
      getToday: () => apiClient.get('/caretaker/tasks/today'),
      uploadPhoto: (taskId, blob) => {
        const form = new FormData();
        form.append('photo', blob, 'photo.jpg');
        return apiClient.post(`/caretaker/tasks/${taskId}/photos`, form, { timeout: 30000 });
      },
      // 음성 인식과 문장 정리가 오래 걸릴 수 있어 제한 시간을 넉넉히 둠 (서버 모델 호출 제한 90초)
      uploadVoice: (taskId, blob, fileName) => {
        const form = new FormData();
        form.append('audio', blob, fileName);
        return apiClient.post(`/caretaker/tasks/${taskId}/voice-memos`, form, { timeout: 120000 });
      },
      retryVoice: (voiceMemoId) =>
        apiClient.post(`/caretaker/voice-memos/${voiceMemoId}/retry`, null, { timeout: 120000 }),
      getLatestVoice: (taskId) => apiClient.get(`/caretaker/tasks/${taskId}/voice-memos/latest`),
      confirmVoice: (voiceMemoId, summary) =>
        apiClient.post(`/caretaker/voice-memos/${voiceMemoId}/confirm`, summary ? { summary } : {}),
      complete: (taskId, { photoId, voiceMemoId } = {}) =>
        apiClient.post(`/caretaker/tasks/${taskId}/complete`, { photoId, voiceMemoId }),
      checkStage: (gardenId, observed, photoId) =>
        apiClient.post(`/gardens/${gardenId}/stage-checks`, { observed, photoId }),
      // 이번 달 활동 요약의 heartsReceivedToday (실패하면 표시하지 않음)
      getHeartsForToday: () =>
        apiClient
          .get('/caretakers/me/summary')
          .then((d) => d?.heartsReceivedToday ?? null)
          .catch(() => null),
    };

export const ttsService = {
  speak: (text, speed = 0.9) =>
    USE_MOCK
      ? Promise.reject(new Error('mock'))
      : apiClient.post('/tts', { text, speed }, { responseType: 'blob', timeout: 10000 }),
};

export const demoService = pick(mockDemo, {
  getState: () => apiClient.get('/demo/state'),
  setWeather: (condition) => apiClient.put('/demo/weather', { condition }),
  // 씨앗부터 열매까지 단계별 시연 (시연 텃밭 B-14만 바뀜)
  setStage: (stage) => apiClient.put('/demo/stage', { stage }),
  fastForward: (days = 18) => apiClient.post('/demo/fast-forward', { days }),
  reset: () => apiClient.post('/demo/reset'),
});