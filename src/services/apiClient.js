// src/services/apiClient.js
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { toUserMessage } from '../utils/errorMessage';

const baseURL = import.meta.env.VITE_API_URL;

export const apiClient = axios.create({ baseURL, timeout: 15000 });

function toError(code) {
  const error = new Error(toUserMessage(code));
  error.code = code ?? null;
  return error;
}

apiClient.interceptors.request.use((config) => {
  const { accessToken, isDemo } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  if (isDemo && config.url?.startsWith('/demo')) config.headers['X-Demo-Mode'] = 'true';
  return config;
});

// 동시에 여러 요청이 401을 받아도 refresh는 한 번만
let refreshPromise = null;

async function refreshTokens() {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) {
    logout();
    throw toError('C4013');
  }
  try {
    const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken });
    const data = res.data?.data;
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (e) {
    logout();
    throw toError('C4013');
  }
}

apiClient.interceptors.response.use(
  (response) => {
    // /tts처럼 바이너리 응답은 그대로 반환
    if (response.config.responseType === 'blob' || response.config.responseType === 'arraybuffer') {
      return response.data;
    }
    const body = response.data;
    if (body?.error?.code) return Promise.reject(toError(body.error.code));
    return body?.data ?? null;
  },
  async (error) => {
    const original = error.config;
    const isAuthApi = original?.url?.startsWith('/auth/');

    if (error.response?.status === 401 && original && !original._retry && !isAuthApi) {
      original._retry = true;
      try {
        if (!refreshPromise) {
          refreshPromise = refreshTokens().finally(() => {
            refreshPromise = null;
          });
        }
        const token = await refreshPromise;
        original.headers.Authorization = `Bearer ${token}`;
        return apiClient(original);
      } catch (refreshError) {
        window.location.replace('/login');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(toError(error.response?.data?.error?.code));
  }
);