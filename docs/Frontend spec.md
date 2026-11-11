# Frontend 개발 명세서 — 대신텃밭

> 2026 용용톤 · 여가 생활 및 인프라 트랙
> 평일엔 처인구 어르신(텃밭 관리사)이 돌보고, 도시 가족(텃밭 주인)은 게임처럼 키우고, 주말엔 수확하는 용인 텃밭 서비스
> 화면 시안: 디자인 캔버스 "대신텃밭 시연 화면" (16개 화면)
> API 기준: `api-spec.md`, `api-detail.md` (백엔드 명세, 2026-11-11 초안)
> 마지막 갱신: 2026-11-11

## 1. 기술 스택

- **Framework**: React 19.x (설치 시점 최신 안정 버전)
- **언어**: JavaScript
- **라우팅**: React Router
- **상태 관리**: Zustand
- **스타일링**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **HTTP 클라이언트**: Axios
- **빌드**: Vite
- **PWA**: vite-plugin-pwa (manifest + Service Worker 자동 생성)
- **린트**: ESLint (Vite 템플릿 기본 설정 + React Hooks 규칙)
- **테스트**: Vitest + React Testing Library (시간 남으면)
- **애니메이션**: CSS 트랜지션 우선, 캐릭터 진화 연출은 Lottie (시간 남으면)
- **폰트**: Noto Sans KR
- **배포**: Vercel

### 구현 형태
- 앱스토어 앱이 아닌 **모바일 웹 + PWA**로 구현함
- 홈 화면에 추가하면 주소창 없이 앱처럼 전체 화면으로 실행됨
- 화면 폭 390px 기준 모바일 레이아웃만 만듦 (PC 전용 레이아웃 없음)
- PC에서 열면 가운데에 최대 430px 폭으로 표시함

## 2. 프로젝트 구조

```
frontend/
├── docs/
│   └── frontend-spec.md      # 이 문서
├── public/
│   ├── mock/                 # 목업 이미지 (작업 인증 사진 등)
│   ├── characters/           # 관리사 기본 캐릭터 이미지
│   ├── pwa-192x192.png       # PWA 아이콘
│   ├── pwa-512x512.png
│   ├── maskable-512x512.png
│   └── apple-touch-icon.png  # iOS 홈 화면 아이콘 (180×180)
├── src/
│   ├── components/
│   │   ├── common/           # MobileLayout, BottomNav, Toast, Button, ProtectedRoute …
│   │   ├── owner/            # 텃밭 주인 화면용
│   │   ├── caretaker/        # 텃밭 관리사 화면용
│   │   └── demo/             # 데모 컨트롤 패널
│   ├── pages/                # 라우트 단위 페이지
│   ├── services/             # apiClient + 기능별 service
│   ├── mocks/                # 목업 데이터 (API 응답 data 형태 그대로)
│   ├── hooks/                # usePolling, useCamera, useRecorder, useSpeech
│   ├── store/                # Zustand 스토어
│   ├── utils/                # nextStep, errorMessage, enum 라벨, 날짜 포맷
│   ├── App.jsx               # 라우터
│   ├── main.jsx
│   └── index.css             # Tailwind + 테마 색
├── .env.example
├── index.html
├── vercel.json
├── vite.config.js
├── package.json
└── README.md
```

## 3. 환경 설정

```env
# 백엔드 API 주소 (배포 주소는 HTTPS 필수 — 카메라·마이크와 혼합 콘텐츠 차단 때문)
VITE_API_URL=https://api.example.com

# true면 services가 mocks/ 데이터를 반환함
VITE_USE_MOCK=true

# 화면 간 반영 주기 (밀리초)
VITE_POLLING_INTERVAL=4000
```

> `VITE_` 접두사 변수는 **빌드 결과물에 그대로 노출**됨. API 키·비밀번호를 넣지 않음.
> AI 모듈(STT, LLM, 이미지 확인)과 기상청·농사로 API는 Backend를 통해서만 호출하며, 브라우저에서 직접 호출하지 않음.
> `.env.local`은 Git에 올리지 않고 `.env.example`만 올림. Vercel은 프로젝트 설정의 Environment Variables에 따로 등록함.

## 4. 주요 페이지

화면 코드는 백엔드 명세(`api-spec.md` 3장)와 같음.

### 4.1 공통

| 경로 | 컴포넌트 | 화면 코드 | 기능 | 사용 API |
|------|----------|-----------|------|----------|
| / | RootRedirect | - | `nextStep`에 따라 이동 | - |
| /login | LoginPage | DT_LOGIN | 아이디·비밀번호 로그인, 로그인 상태 유지 | POST /auth/login |
| /signup | SignupPage | DT_SIGNUP | 이름·아이디·비밀번호, 아이디 중복 확인 | POST /auth/signup, GET /auth/username-check |
| /role | RoleSelectPage | DT_ROLE | 텃밭 주인 / 텃밭 관리사 선택 | PUT /users/me/role |
| /profile/owner | OwnerProfilePage | DT_PROFILE_OWNER | 가족 이름, 사는 곳, 농장 + 칸 번호, 담당 관리사 미리보기 | GET /farms, GET /farms/{farmId}/plots/{plotCode}, POST /owners/me/profile |
| /profile/caretaker | CaretakerProfilePage | DT_PROFILE_CARE | 성함, 일할 농장, 기본 캐릭터 고르기 | GET /farms, POST /caretakers/me/profile, POST /tts |

### 4.2 텃밭 주인

| 경로 | 컴포넌트 | 화면 코드 | 기능 | 사용 API |
|------|----------|-----------|------|----------|
| /owner | OwnerHomePage | DT_HOME | 캐릭터(날씨·단계·기분), 날씨, 스트릭·XP, D-day, 최근 돌봄 + 하트, 오늘의 응원. 미확인 이벤트가 있으면 EvolveOverlay | GET /gardens/{gardenId}/home, POST .../cheers, POST /care-logs/{id}/hearts, GET .../events |
| (오버레이) | EvolveOverlay | DT_EVOLVE | 단계 변화 축하, 보상 | POST /events/{eventId}/ack |
| /owner/diary | OwnerDiaryPage | DT_DIARY | 성장 일기 타임라인, 필터(ALL/PHOTO/STAGE), 무한 스크롤 | GET /gardens/{gardenId}/diary |
| /owner/harvest | OwnerHarvestPage | DT_HARVEST | 수확 예정일, 방문 시간 선택·예약, 나들이 추천 | GET .../harvest, GET .../visit-slots, POST /visits, GET .../outings |
| /owner/my | OwnerMyPage | DT_MY | 프로필, 스트릭·XP, 내 텃밭·담당 관리사, 주간 퀘스트 | GET /users/me, GET .../home, GET /quests/weekly, POST /quests/{id}/claim |

### 4.3 텃밭 관리사

| 경로 | 컴포넌트 | 화면 코드 | 기능 | 사용 API |
|------|----------|-----------|------|----------|
| /caretaker | CaretakerTodayPage | DT_CARE_TODAY | 오늘 할 일 카드(한 장씩), 진행도, 읽어주기, 날씨 안내, 다음 할 일 | GET /caretaker/tasks/today, POST /tts |
| /caretaker/tasks/:taskId/photo | TaskPhotoPage | DT_CARE_PHOTO | 카메라 + 가이드 네모, 촬영 확인, 사진 없이 완료 | POST /caretaker/tasks/{taskId}/photos |
| /caretaker/tasks/:taskId/voice | TaskVoicePage | DT_CARE_VOICE | 녹음 → AI 정리 확인(맞아요/다시 말하기) | POST .../voice-memos, POST /caretaker/voice-memos/{id}/confirm |
| /caretaker/tasks/:taskId/done | TaskDonePage | DT_CARE_DONE | 작업 완료 처리, 단계 확인, 다음 할 일 보기 | POST .../complete, POST /gardens/{gardenId}/stage-checks |

### 4.4 시연용

| 경로 | 컴포넌트 | 화면 코드 | 기능 | 사용 API |
|------|----------|-----------|------|----------|
| /demo | DemoPage | DT_DEMO | 주인·관리사 iframe 2개 + DemoPanel | GET /demo/state, PUT /demo/weather, POST /demo/fast-forward, POST /demo/reset |

- iframe 주소: `/owner?demo=owner`, `/caretaker?demo=caretaker` (6절 토큰 처리 참고)
- DemoPanel은 `/demo` 페이지 자체에서 **시연용 ADMIN 계정**으로 로그인해 호출함. `/demo/*`는 ADMIN 토큰 + `X-Demo-Mode: true`가 모두 있어야 동작함
- 비 오는 날 홈은 별도 페이지가 아니라 OwnerHomePage의 날씨 상태로 처리함
- 열매 진화 연출은 OwnerHomePage 위에 띄우는 오버레이임

### 4.5 화면 흐름

```
[가입]   /signup → /role → /profile/owner 또는 /profile/caretaker → 각자 홈
[로그인] /login → nextStep에 맞는 화면
[관리사] /caretaker → photo → voice → done(완료 API 호출 + 단계 확인) → /caretaker (다음 카드)
[주인]   /owner ↔ /owner/diary ↔ /owner/harvest ↔ /owner/my (하단 탭)
```

`nextStep` → 경로

| nextStep | 경로 |
|----------|------|
| ROLE_SELECT | /role |
| PROFILE_OWNER | /profile/owner |
| PROFILE_CARE | /profile/caretaker |
| OWNER_HOME | /owner |
| CARE_TODAY | /caretaker |

### 4.6 이번 범위에서 만들지 않는 화면
- DT_LEAGUE (주간 리그), 알림 목록, AI 아바타 생성, 퀴즈
- 해당 API는 백엔드 명세에 있지만 프론트는 호출하지 않음

## 5. 컴포넌트

### 5.1 공통 컴포넌트
- **MobileLayout**: 최대 430px 폭 컨테이너, 배경색
- **BottomNav**: 주인용 하단 탭 (홈·일기·수확·마이)
- **Button**: primary / secondary. 크기 `md`(주인), `xl`(관리사, 높이 64px 이상)
- **TextField**: 라벨 + 입력칸 + 에러 문구
- **Toast**: 하단 2.5초 표시 알림
- **LoadingSpinner**, **ErrorMessage**, **EmptyState**
- **ProtectedRoute**: 로그인·역할 확인 후 이동
- **ReadAloudButton**: `/tts` 음성 재생, 실패 시 브라우저 `speechSynthesis`로 대체
- **CaretakerAvatar**: 관리사 기본 캐릭터 이미지 (avatarUrl이 없으면 기본 이미지)

### 5.2 텃밭 주인 컴포넌트
- **CropCharacter**: props `stage`(SEED/SPROUT/FLOWER/FRUIT), `animation`(sunny_happy/rain_umbrella/hot_sweat/sad_droop), `message`
- **WeatherBadge**: 지역 · 날씨 · 기온
- **StageProgress**: 4단계 진행 막대 + D-day
- **CareLogCard**: 관리사, 시간, 요약, 사진, 감사 하트
- **StreakBadge**, **XpBadge**, **CheerButton**
- **DiaryFilter**, **DiaryList**, **DiaryItem** (CARE_LOG / STAGE_CHANGE / REST_DAY)
- **EvolveOverlay**: 단계 변화 축하, XP·배지 표시, 확인 시 ack
- **VisitSlotPicker**, **OutingCard**, **QuestList**

### 5.3 텃밭 관리사 컴포넌트
- **TaskProgress**: 오늘 할 일 진행 막대
- **TaskCard**: 칸 번호, 작물, 작업 제목(32px 이상), 설명, 예상 시간, 날씨 안내
- **NextTaskBar**: 다음 할 일 미리보기
- **CameraCapture**: 카메라 미리보기 + 가이드 네모 + 셔터, 촬영 결과 확인
- **VoiceRecorder**: 큰 마이크 버튼, 녹음 시간, 파형
- **VoiceSummaryCard**: 음성 원문(transcript) + 정리 문장(summary) + 이상한 점(issues 라벨)
- **StageConfirm**: FLOWER(꽃 폈어요) / FRUIT(열매 맺혔어요) / NO_CHANGE(아직 그대로예요)
- **CharacterPicker**: 관리사 기본 캐릭터 고르기

### 5.4 시연 컴포넌트
- **PhoneFrame**: 390×844 iframe 테두리
- **DemoPanel**: WeatherToggle(SUNNY/RAIN/HOT), FastForwardButton(18일), ResetButton

### 5.5 관리사 화면 접근성 기준
- 본문 글씨 18px 이상, 작업 제목 32px 이상
- 버튼 높이 64px 이상, 한 화면 주요 버튼 최대 2개
- 모든 안내 문구에 읽어주기 제공
- 색만으로 상태를 구분하지 않음 (아이콘·문구 함께 표시)

## 6. 상태 관리

| 스토어 | 파일 | 상태 | 액션 |
|--------|------|------|------|
| useAuthStore | `store/authStore.js` | userId, role, nextStep, accessToken, refreshToken, isDemo | login, setTokens, setRole, setNextStep, logout |
| useOwnerStore | `store/ownerStore.js` | gardenId, home, diaryFilter | setGardenId, setHome, setDiaryFilter |
| useCaretakerStore | `store/caretakerStore.js` | today, currentTaskId, photoId, voiceMemoId | setToday, setCurrentTask, setPhotoId, setVoiceMemoId, resetTask |
| useUiStore | `store/uiStore.js` | toast | showToast, hideToast |

```javascript
// store/authStore.js
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// 데모 페이지(/demo, ADMIN)와 iframe(?demo=owner / ?demo=caretaker)은 같은 브라우저에서 세 계정을 동시에 쓰므로
// localStorage를 공유하면 계정이 섞임 → 데모 모드에서는 메모리에만 보관함
const isDemo =
  window.location.pathname.startsWith('/demo') ||
  new URLSearchParams(window.location.search).has('demo');

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
      role: null, // 'USER' | 'OWNER' | 'CARETAKER' | 'ADMIN'(시연용)
      nextStep: null,
      accessToken: null,
      refreshToken: null,
      isDemo,
      login: ({ userId, role, nextStep, accessToken, refreshToken }) =>
        set({ userId, role, nextStep, accessToken, refreshToken }),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      // 역할을 고르면 토큰이 새로 발급됨 (역할이 토큰에 들어가기 때문)
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
```

> 일반 사용자는 `persist`로 토큰을 localStorage에 저장함. 선택 근거와 XSS 위험은 9절에 기재함.
> 데모 iframe은 진입 시 `?demo=` 값에 맞는 시연 계정(주인·관리사)으로, `/demo` 페이지는 시연용 ADMIN 계정으로 자동 로그인함 (계정 정보는 백엔드에서 받음).

## 7. API 연동

### 7.1 구성
- `services/apiClient.js`: Axios 인스턴스, 요청 인터셉터(토큰·데모 헤더), 응답 인터셉터(GlobalResponse 해제, 401 재발급)
- 기능별 service 파일이 모든 API 호출을 담당함. 페이지·컴포넌트에서 axios를 직접 쓰지 않음
- `VITE_USE_MOCK=true`면 각 service가 `mocks/` 데이터를 반환함. 목업은 API 응답의 `data` 형태를 그대로 따름

### 7.2 공통 규칙 (백엔드 명세 기준)

| 항목 | 내용 |
|------|------|
| 응답 | `{ "data": {...}, "error": { "code": null, "message": null } }` — `error.code`가 있으면 실패 |
| 인증 | `Authorization: Bearer {accessToken}` (만료 3600초) |
| 재발급 | `POST /auth/refresh` — Refresh Token도 새로 발급, 이전 토큰 무효 |
| 시연 | `/demo/*`는 시연용 ADMIN 토큰 + `X-Demo-Mode: true` 둘 다 필요 |
| 경로 | `/api/v1` 등 접두어 없음 (`{VITE_API_URL}/auth/login`) |
| 날짜 | 날짜 `YYYY-MM-DD`, 시각 ISO 8601 `+09:00` |
| 목록 | 커서 방식 `cursor`, `limit`(기본 20), 응답 `nextCursor`가 `null`이면 마지막 |
| ID | 접두어 문자열 (`usr_minji`, `gdn_b14`, `tsk_1110_b14` …) |
| 예외 | `POST /tts`는 GlobalResponse가 아닌 `audio/mpeg` 바이너리 |

```javascript
// services/apiClient.js
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
  const { accessToken } = useAuthStore.getState();
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  // 시연 API는 ADMIN 토큰과 함께 이 헤더가 필요함 (권한 확인은 서버에서)
  if (config.url?.startsWith('/demo')) config.headers['X-Demo-Mode'] = 'true';
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
```

### 7.3 서비스 목록 (프론트가 호출하는 API만)

| 서비스 | 함수 | Method · Endpoint |
|--------|------|-------------------|
| authService | signup | POST /auth/signup |
| | checkUsername | GET /auth/username-check?username= |
| | login | POST /auth/login |
| | logout | POST /auth/logout |
| userService | getMe | GET /users/me |
| | setRole | PUT /users/me/role |
| farmService | getFarms | GET /farms?district=&cursor=&limit= |
| | previewPlot | GET /farms/{farmId}/plots/{plotCode} |
| profileService | createOwnerProfile | POST /owners/me/profile |
| | updateOwnerProfile | PATCH /owners/me/profile |
| | createCaretakerProfile | POST /caretakers/me/profile |
| ttsService | speak | POST /tts (`responseType: 'blob'`) |
| homeService | getHome | GET /gardens/{gardenId}/home |
| | getGrowth | GET /gardens/{gardenId}/growth |
| | cheer | POST /gardens/{gardenId}/cheers |
| | sendHeart | POST /care-logs/{careLogId}/hearts |
| diaryService | getDiary | GET /gardens/{gardenId}/diary?filter=&cursor=&limit= |
| eventService | getEvents | GET /gardens/{gardenId}/events |
| | ackEvent | POST /events/{eventId}/ack |
| questService | getWeeklyQuests | GET /quests/weekly |
| | claimQuest | POST /quests/{questId}/claim |
| harvestService | getHarvest | GET /gardens/{gardenId}/harvest |
| | getVisitSlots | GET /gardens/{gardenId}/visit-slots?from=&to= |
| | reserveVisit | POST /visits |
| | getOutings | GET /gardens/{gardenId}/outings |
| taskService | getToday | GET /caretaker/tasks/today |
| | uploadPhoto | POST /caretaker/tasks/{taskId}/photos (multipart `photo`) |
| | uploadVoice | POST /caretaker/tasks/{taskId}/voice-memos (multipart `audio`) |
| | confirmVoice | POST /caretaker/voice-memos/{voiceMemoId}/confirm |
| | complete | POST /caretaker/tasks/{taskId}/complete |
| | checkStage | POST /gardens/{gardenId}/stage-checks |
| demoService | getState | GET /demo/state |
| | setWeather | PUT /demo/weather |
| | fastForward | POST /demo/fast-forward |
| | reset | POST /demo/reset |

```javascript
// services/taskService.js (작성 예시)
import { apiClient } from './apiClient';
import { USE_MOCK, mockDelay } from './mock';
import { todayTasks, photoResult, voiceMemo, completeResult, stageCheckResult } from '../mocks/task';

export const taskService = {
  getToday: () => (USE_MOCK ? mockDelay(todayTasks) : apiClient.get('/caretaker/tasks/today')),

  uploadPhoto: (taskId, file) => {
    if (USE_MOCK) return mockDelay(photoResult);
    const form = new FormData();
    form.append('photo', file);
    return apiClient.post(`/caretaker/tasks/${taskId}/photos`, form);
  },

  uploadVoice: (taskId, blob, fileName) => {
    if (USE_MOCK) return mockDelay(voiceMemo, 1500);
    const form = new FormData();
    form.append('audio', blob, fileName);
    return apiClient.post(`/caretaker/tasks/${taskId}/voice-memos`, form, { timeout: 30000 });
  },

  confirmVoice: (voiceMemoId, summary) =>
    USE_MOCK
      ? mockDelay({ voiceMemoId, status: 'CONFIRMED' })
      : apiClient.post(`/caretaker/voice-memos/${voiceMemoId}/confirm`, summary ? { summary } : {}),

  complete: (taskId, { photoId, voiceMemoId } = {}) =>
    USE_MOCK
      ? mockDelay(completeResult)
      : apiClient.post(`/caretaker/tasks/${taskId}/complete`, { photoId, voiceMemoId }),

  checkStage: (gardenId, observed, photoId) =>
    USE_MOCK
      ? mockDelay(stageCheckResult)
      : apiClient.post(`/gardens/${gardenId}/stage-checks`, { observed, photoId }),
};
```

### 7.4 파일 업로드
- 사진: `multipart/form-data` 파트 `photo`, jpg·png 10MB 이하. 촬영 이미지는 JPEG로 압축(긴 변 1600px) 후 전송
- 음성: `multipart/form-data` 파트 `audio`, 60초 이하, webm·m4a·mp4·wav 허용
  - 크롬(안드로이드)은 webm, 아이폰 사파리는 mp4로 녹음된 파일을 변환 없이 그대로 전송함
- 업로드는 `Content-Type`을 직접 지정하지 않음 (Axios가 boundary 포함해 자동 설정)

### 7.5 관리사 작업 흐름과 API 호출 순서

```
1. GET /caretaker/tasks/today              → gardens[].tasks[]를 카드 목록으로 펼침
2. (선택) POST .../tasks/{taskId}/photos   → photoId 저장
3. (선택) POST .../tasks/{taskId}/voice-memos → voiceMemoId, summary 표시
         POST .../voice-memos/{id}/confirm → "맞아요, 보낼게요"
4. POST .../tasks/{taskId}/complete        → { photoId, voiceMemoId } 함께 전송
5. 응답 stageCheck.required가 true면 단계 확인 표시
   → POST /gardens/{gardenId}/stage-checks
6. remainingTasks > 0이면 다음 카드, 0이면 "오늘 일 끝"
```

### 7.6 enum 화면 표시

| enum | 값 → 화면 문구 |
|------|----------------|
| stage | SEED 씨앗 · SPROUT 새싹 · FLOWER 꽃 · FRUIT 열매 |
| weather.condition | SUNNY 맑음 · CLOUDY 흐림 · RAIN 비 · HOT 더움 · COLD 추움 |
| district | SUJI 수지구 · GIHEUNG 기흥구 · CHEOIN 처인구 |
| task.type | WATER 물 주기 · SUPPORT 지지대 · WEED 잡초 뽑기 · PRUNE 곁순 정리 · FERTILIZE 거름 주기 · HARVEST_PREP 수확 준비 · CHECK 살펴보기 |
| diary type | CARE_LOG 돌봄 · STAGE_CHANGE 성장 단계 · REST_DAY 쉬는 날 |
| voice issues | 라벨 목록 백엔드 협의 중 (예: LEAF_SPOT → 잎에 점이 있어요) |

라벨은 `utils/labels.js` 한 곳에서 관리함.

## 8. 주요 기능

### 8.1 모바일 우선 레이아웃
- 390px 기준, 최대 430px 폭 중앙 정렬
- 하단 탭·고정 버튼은 `env(safe-area-inset-bottom)` 여백 적용

### 8.2 화면 간 반영 (폴링)
- 관리사 작업 완료 → 주인 홈·일기, 데모 패널 날씨 변경 → 두 화면 갱신을 폴링으로 처리함
- `hooks/usePolling.js`로 `VITE_POLLING_INTERVAL`(기본 4초)마다 재조회
- 적용: OwnerHomePage(`/home`, `/events`), OwnerDiaryPage(첫 페이지만), CaretakerTodayPage(`/tasks/today`)
- 탭이 숨겨지면(`document.hidden`) 폴링을 멈춤

### 8.3 날씨·캐릭터 상태
- 홈 응답의 `character.animation`(sunny_happy / rain_umbrella / hot_sweat / sad_droop)으로 캐릭터 이미지·카드 배경을 바꿈
- `character.message`를 말풍선에, `weather`를 WeatherBadge에 표시
- 별도 페이지 없이 OwnerHomePage 한 곳에서 처리

### 8.4 성장 단계 변화 연출
- 홈 응답 `hasUnreadEvent`가 true면 `GET /events` 호출 → EvolveOverlay 표시
- 확인 버튼 → `POST /events/{eventId}/ack` → 보상 XP·배지 표시 후 닫기

### 8.5 작업 인증 사진
- `getUserMedia({ video: { facingMode: 'environment' } })`로 후면 카메라 미리보기
- 가이드 네모 오버레이, 셔터 시 canvas로 캡처 → JPEG Blob
- 권한 거부·미지원 시 `<input type="file" accept="image/*" capture="environment">`로 대체
- 응답 `aiCheck.message`가 있으면 "지지대가 잘 보여요"처럼 표시, `null`이면 표시 안 함
- 화면을 벗어나면 카메라 트랙 정지

### 8.6 말로 남기기 (녹음)
- `MediaRecorder`로 녹음, 60초가 되면 자동 정지
- `MediaRecorder.isTypeSupported`로 `audio/mp4` → `audio/webm` 순서로 형식 선택, 파일 이름 확장자도 맞춤
- 업로드 후 결과가 올 때까지 "말씀을 정리하고 있어요" 표시 (요청 타임아웃 30초)
- 결과의 `summary`는 수정 가능, 수정했으면 confirm 요청에 `summary` 포함

### 8.7 읽어주기
- `POST /tts`로 받은 `audio/mpeg`를 `Audio` 객체로 재생 (속도 0.9)
- 같은 문장은 화면 안에서 Blob URL을 재사용
- 요청 실패 시 브라우저 `speechSynthesis`(`ko-KR`)로 대체

### 8.8 로딩·에러·빈 상태
- 조회: 스켈레톤 또는 LoadingSpinner
- 전송 버튼: 처리 중 비활성화, 중복 전송 방지 (`C4095`도 성공처럼 처리할 곳 구분)
- 실패: `utils/errorMessage.js` 문구 + 다시 시도 버튼
- 빈 상태: 성장 일기·할 일이 없을 때 EmptyState 문구

### 8.9 방문 예약
- 슬롯 선택 → `POST /visits` → 성공 시 Toast "토요일 오전 10시로 예약됐어요"
- `headcount`는 선택값이라 화면에서 입력받지 않고 보내지 않음

### 8.10 데모 페이지
- /demo에서 주인·관리사 iframe + DemoPanel
- DemoPanel 버튼 → demoService 호출 → 두 iframe은 폴링으로 자동 갱신
- 패널 진입 시 `GET /demo/state`로 현재 날씨·단계 표시

### 8.11 PWA
- `vite-plugin-pwa`로 manifest와 Service Worker를 자동 생성함
- **설치**: 안드로이드 크롬은 설치 안내가 자동으로 뜸. iOS 사파리는 공유 → "홈 화면에 추가"를 직접 눌러야 하므로 첫 진입 시 안내 배너를 1회 표시함
- **실행 모드**: `display: standalone`, 세로 고정
- **캐시 범위**: 빌드된 정적 파일만 캐시함. API 응답, 업로드, 로그인 요청은 캐시하지 않음
- **업데이트**: `registerType: 'autoUpdate'` + `skipWaiting`, `clientsClaim`. 시연 직전 배포 후에는 앱을 완전히 종료했다 다시 열어 확인함
- **오프라인**: 제공하지 않음. 연결이 끊기면 "인터넷 연결을 확인해 주세요" 안내
- **푸시 알림**: 이번 범위에서 제외 (`POST /users/me/push-tokens` 호출하지 않음)
- **개발 중**: `npm run dev`에서는 Service Worker를 끔. 확인은 `npm run build && npm run preview` 또는 배포본에서 함

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png'],
      manifest: {
        name: '대신텃밭',
        short_name: '대신텃밭',
        description: '평일엔 할머니가 돌보고, 나는 게임처럼 키우는 용인 텃밭',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#FBF8F1',
        theme_color: '#4C8C3F',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
      },
      devOptions: { enabled: false },
    }),
  ],
});
```

> 아이콘은 512px 원본 하나를 받아 `npx @vite-pwa/assets-generator`로 나머지 크기를 생성함.

### 8.12 이번 범위에서 제외
- AI 아바타 생성(기본 캐릭터 고르기로 대체), 주간 리그, 배지 목록, 퀴즈, 알림 목록, 푸시 알림, 예약 취소, 휴대폰 인증, 약관 동의, 비밀번호 찾기, 결제, 오프라인 모드

## 9. 프론트엔드 보안

> 점검·조치 결과는 `9. 보안점검서.md` 에 기록함.

- **XSS 방지**: `dangerouslySetInnerHTML` 사용하지 않음. AI 요약, 음성 원문, 캐릭터 메시지 등 서버·AI가 만든 문장은 모두 일반 텍스트로 렌더링함 (React 기본 이스케이프)
- **토큰 저장**: 일반 사용자는 Access·Refresh Token을 localStorage(`persist`)에, 데모 iframe은 메모리에만 보관함
  - 근거: 해커톤 일정상 구현이 가장 단순하고 새로고침 후에도 로그인 유지 가능
  - 위험: XSS 발생 시 토큰 탈취 가능 → 위 XSS 원칙 준수, 외부 스크립트는 Google Fonts만 사용
  - 개선안: 백엔드가 Refresh Token을 HttpOnly 쿠키로 주면 쿠키 방식으로 전환
- **토큰 만료 처리**: 응답 인터셉터에서 `401 → POST /auth/refresh → 원래 요청 재시도`. 동시 요청은 재발급을 1회로 묶음. 재발급 실패 시 로그아웃 후 /login
- **보호 라우트**: ProtectedRoute로 로그인·역할(OWNER/CARETAKER)을 확인함. 사용자 편의용이며 **최종 인가는 서버에서 수행함** (`C403`)
- **시연 API**: 서버가 시연용 ADMIN 토큰 + `X-Demo-Mode` 헤더가 모두 있을 때만 허용함. ADMIN 계정 정보는 코드·환경 변수에 넣지 않고 시연 현장에서 `/demo` 로그인 화면에 직접 입력함
- **카메라·마이크**: HTTPS에서만 요청, 사용자가 버튼을 눌렀을 때만 권한 요청, 화면 이탈 시 트랙 정지
- **업로드 검증**: 클라이언트에서 형식과 크기(사진 10MB, 음성 60초) 1차 확인. 최종 검증은 서버 (`C4001`)
- **Service Worker 캐시**: 토큰이 포함된 요청과 API 응답은 캐시하지 않음. 로그아웃 후 같은 기기에서 이전 데이터가 보이지 않음
- **의존성 점검**: 배포 전 `npm audit --audit-level=high`, high 이상은 업데이트 후 결과 기록
- **에러 노출**: 서버 메시지를 그대로 보여주지 않고 `utils/errorMessage.js`에서 코드별 사용자 문구로 변환함

```javascript
// utils/errorMessage.js
const MESSAGES = {
  C002: '입력한 내용을 다시 확인해 주세요.',
  C403: '접근할 수 없는 화면이에요.',
  C404: '찾을 수 없어요. 다시 확인해 주세요.',
  C4001: '지원하지 않는 파일이에요. 다시 찍거나 녹음해 주세요.',
  C4004: '아직 완료되지 않았어요.',
  C4012: '아이디 또는 비밀번호를 다시 확인해 주세요.',
  C4013: '다시 로그인해 주세요.',
  C4041: '아이디 또는 비밀번호를 다시 확인해 주세요.',
  C4092: '이미 사용 중인 아이디예요.',
  C4093: '이미 다른 가족이 연결된 칸이에요.',
  C4094: '이미 프로필이 있어요.',
  C4095: '이미 처리됐어요.',
  C4096: '예약이 마감된 시간이에요.',
};

export function toUserMessage(code) {
  return MESSAGES[code] ?? '잠시 후 다시 시도해 주세요.';
}
```

> 로그인 실패는 아이디 없음(`C4041`)과 비밀번호 불일치(`C4012`)를 같은 문구로 보여줌 (아이디 존재 여부 노출 방지).

## 10. 빌드 및 배포

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest",
    "audit": "npm audit --audit-level=high"
  }
}
```

### Vercel 배포
- GitHub 저장소 연결 → push 시 자동 배포 (HTTPS 기본 제공)
- 프론트가 저장소의 하위 폴더면 Root Directory를 `frontend`로 지정
- 환경 변수 `VITE_API_URL`, `VITE_USE_MOCK`, `VITE_POLLING_INTERVAL` 등록. 바꾼 뒤에는 재배포해야 반영됨
- 백엔드 CORS에는 **정식 주소 하나**만 등록 (브랜치·PR 미리보기 주소는 매번 달라짐)

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    { "source": "/sw.js", "headers": [{ "key": "Cache-Control", "value": "no-cache" }] },
    { "source": "/manifest.webmanifest", "headers": [{ "key": "Content-Type", "value": "application/manifest+json" }] }
  ]
}
```

> `vercel.json`은 `package.json`과 같은 위치에 둠. JSON이라 주석을 넣으면 안 됨.

### 배포 일정
- 초기 세팅 직후: `VITE_USE_MOCK=true`로 배포 → 폰에서 카메라·녹음·홈 화면 추가 확인
- 백엔드 배포 후: `VITE_USE_MOCK=false`로 재배포 → 연동 확인
- 마감 하루 전: 배포 주소로 전체 시연 리허설

### 배포 후 PWA 확인
- 크롬 개발자도구 → Application → Manifest 오류 없음, Service Workers 등록 확인
- 안드로이드: 설치 안내 → 홈 화면 아이콘 → 전체 화면 실행
- iOS: 사파리 공유 → 홈 화면에 추가 → 전체 화면 실행, 카메라·마이크 동작 확인

## 11. Docker 설정 (선택)

> 기본 배포는 Vercel이라 Docker는 쓰지 않음. 서버 한 대로 합치거나 대회에서 이미지를 요구할 때만 사용함.

- 멀티스테이지 빌드 (Node로 빌드 → Nginx로 서빙)
- `VITE_API_URL`은 빌드 시점에 들어가므로 `--build-arg`로 전달

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_USE_MOCK=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_USE_MOCK=$VITE_USE_MOCK
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  location / {
    try_files $uri $uri/ /index.html;
  }

  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  location = /sw.js {
    add_header Cache-Control "no-cache";
  }

  location = /manifest.webmanifest {
    default_type application/manifest+json;
    add_header Cache-Control "no-cache";
  }

  add_header X-Content-Type-Options "nosniff";
  add_header X-Frame-Options "SAMEORIGIN";
  add_header Referrer-Policy "strict-origin-when-cross-origin";
}
```

## 12. 백엔드 협의 사항

| 항목 | 내용 | 상태 |
|------|------|------|
| 음성 형식 | webm, m4a, mp4, wav 모두 허용 | 반영 완료 |
| 시연 API 보안 | `/demo/*`는 시연용 ADMIN 토큰 + `X-Demo-Mode: true` 필요 | 반영 완료 |
| 경로 접두어 | `/api/v1` 사용 안 함, 명세 경로 그대로 | 결정 |
| 방문 예약 | `headcount` 선택값 | 반영 예정 |
| 우선순위 | 알림 목록, 예약 취소는 맨 뒤로. 푸시 토큰 API는 있지만 프론트 미사용 | 결정 |
| CORS·HTTPS | 백엔드 HTTPS 배포, CORS에 Vercel 정식 주소 등록 | 추후 작업 |
| 배치 대체 | 할 일 조회 시 그날 작업 없으면 즉시 생성, 프로필 등록 시 첫 작업·일기 생성 | 답변 대기 |
| district | 디자인에 처인구 선택지 있음, API는 SUJI·GIHEUNG만 | 대기 |
| 가족 수 | `familySize` 필드 추가 여부 (예약 인원이 선택값이 되어 급하지 않음) | 답변 대기 |
| 캐릭터 이름 | 작물별 고정("토순이") → 프로필 화면 입력칸 삭제 예정 | 결정 |
| 음성 issues 라벨 | issues 코드별 한글 문구 목록 요청 | 대기 |
| 마이페이지 | 보낸 하트 수, 관리사 돌봄 횟수 필드 추가 요청 | 대기 |
| 성장 일기 원문 | CARE_LOG에 음성 원문 필드 (선택) | 대기 |
| 기본 캐릭터 | 관리사 프로필에 캐릭터 선택값 저장 필드 | 협의 필요 |
| 시연 계정 | 주인·관리사·ADMIN 아이디/비밀번호 | 대기 |