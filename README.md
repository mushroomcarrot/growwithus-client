# 대신텃밭 Frontend

> 평일엔 할머니가 돌보고, 나는 게임처럼 키우고, 주말엔 수확하는 용인 텃밭
> 2026 용용톤 · 여가 생활 및 인프라 트랙

수지·기흥의 도시 가족(텃밭 주인)이 처인구 텃밭 한 칸을 분양받으면, 평일 관리는 근처 어르신(텃밭 관리사)이 AI가 정해준 작업으로 수행함. 가족은 실제 날씨대로 자라는 작물 캐릭터를 매일 키우고 주말에 직접 수확함.

이 저장소는 모바일 웹(PWA) 프론트엔드임.

## 주요 기능

### 텃밭 주인 (도시 가족)
- 실제 날씨와 성장 단계에 반응하는 작물 캐릭터 (맑음·비·더움)
- 스트릭·XP·오늘의 응원, 관리사에게 감사 하트 보내기
- 관리사 사진·메시지·AI 요약이 쌓이는 성장 일기
- 단계가 오르면 진화 연출, 수확 예정일과 주말 방문 예약, 처인 나들이 추천

### 텃밭 관리사 (처인구 어르신)
- 오늘 할 일만 큰 카드로 한 장씩, 읽어주기
- 작업 인증 사진 (가이드 네모 촬영)
- 말로 남기기 (녹음 → AI가 가족용 문장으로 정리)
- 성장 단계 확인 (꽃 폈어요 / 열매 맺혔어요 / 그대로예요)

### 시연
- `/demo`: 주인·관리사 화면을 나란히 띄우고 날씨 변경, 18일 빨리 감기, 초기화
- 데모 패널은 시연용 ADMIN 계정으로만 동작함

## 기술 스택

| 구분 | 사용 |
|------|------|
| Framework | React 19, Vite |
| 언어 | JavaScript |
| 라우팅 | React Router |
| 상태 관리 | Zustand |
| 스타일 | Tailwind CSS v4 |
| HTTP | Axios |
| PWA | vite-plugin-pwa |
| 린트 | ESLint |
| 배포 | Vercel |

## 시작하기

### 요구 사항
- Node.js 20 이상

### 설치와 실행

```bash
npm install
cp .env.example .env.local
npm run dev
```

브라우저에서 `http://localhost:5173` 접속.

### 환경 변수 (`.env.local`)

| 변수 | 설명 | 예시 |
|------|------|------|
| `VITE_API_URL` | 백엔드 API 주소 | `http://localhost:8080` |
| `VITE_USE_MOCK` | `true`면 목업 데이터 사용 | `true` |
| `VITE_POLLING_INTERVAL` | 화면 간 반영 주기(ms) | `4000` |

- `.env.local`은 Git에 올리지 않음
- `VITE_` 값은 빌드 결과물에 그대로 노출되므로 비밀 값을 넣지 않음
- 값을 바꾸면 개발 서버를 다시 켜야 반영됨

### 목업 모드
백엔드 없이 화면을 개발할 때는 `VITE_USE_MOCK=true`로 둠. `src/services/*`가 `src/mocks/*`의 데이터를 반환하며, 목업은 API 응답의 `data` 형태를 그대로 따름.

## 스크립트

| 명령 | 설명 |
|------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | 배포용 빌드 (`dist/`) |
| `npm run preview` | 빌드 결과 미리보기 (PWA 동작 확인용) |
| `npm run lint` | ESLint 검사 |
| `npm run audit` | 의존성 보안 점검 (high 이상) |

## 폴더 구조

```
src/
├── components/
│   ├── common/      # 레이아웃, 하단 탭, 토스트, 버튼, 보호 라우트
│   ├── owner/       # 텃밭 주인 화면 컴포넌트
│   ├── caretaker/   # 텃밭 관리사 화면 컴포넌트
│   └── demo/        # 데모 컨트롤 패널
├── pages/           # 라우트 단위 페이지
├── services/        # apiClient + 기능별 API 호출
├── mocks/           # 목업 데이터
├── hooks/           # usePolling, useCamera, useRecorder, useSpeech
├── store/           # Zustand 스토어
└── utils/           # nextStep, 에러 문구, enum 라벨
```

## 화면과 경로

| 경로 | 화면 | 사용자 |
|------|------|--------|
| `/login` | 로그인 | 공통 |
| `/signup` | 회원가입 | 공통 |
| `/role` | 역할 선택 | 공통 |
| `/profile/owner` | 주인 프로필 설정 (농장·칸 번호 매칭) | 주인 |
| `/profile/caretaker` | 관리사 프로필 설정 | 관리사 |
| `/owner` | 주인 홈 (날씨별 캐릭터, 진화 연출) | 주인 |
| `/owner/diary` | 성장 일기 | 주인 |
| `/owner/harvest` | 수확·방문 예약 | 주인 |
| `/owner/my` | 마이페이지 | 주인 |
| `/caretaker` | 오늘 할 일 | 관리사 |
| `/caretaker/tasks/:taskId/photo` | 작업 인증 사진 | 관리사 |
| `/caretaker/tasks/:taskId/voice` | 말로 남기기 | 관리사 |
| `/caretaker/tasks/:taskId/done` | 완료·단계 확인 | 관리사 |
| `/demo` | 시연 페이지 | 시연 |

로그인 후 이동할 화면은 서버가 주는 `nextStep` 값으로 정함.

## API 연동

- 백엔드 응답은 `{ data, error: { code, message } }` 형식이며, `apiClient`가 `data`만 꺼내서 돌려줌
- `error.code`가 있으면 `utils/errorMessage.js`의 사용자 문구로 바꿔서 에러를 던짐
- 401이면 `POST /auth/refresh`로 토큰을 재발급하고 원래 요청을 다시 보냄
- 경로에 `/api/v1` 같은 접두어를 붙이지 않음 (예: `{VITE_API_URL}/auth/login`)
- 페이지·컴포넌트에서 axios를 직접 쓰지 않고 `services/`의 함수만 사용함
- 화면 간 반영(관리사 완료 → 주인 일기)은 폴링으로 처리함

API 목록과 필드는 백엔드 명세(`api-spec.md`, `api-detail.md`)를 따름.

## PWA

- 배포 주소에서 홈 화면에 추가하면 앱처럼 실행됨
  - 안드로이드 크롬: 설치 안내가 자동으로 뜸
  - iOS 사파리: 공유 → 홈 화면에 추가
- 개발 서버(`npm run dev`)에서는 Service Worker가 꺼져 있음. 확인은 `npm run build && npm run preview`로 함
- 카메라·마이크와 PWA는 HTTPS에서만 동작하므로 폰 테스트는 배포 주소로 함

## 배포

- Vercel에 GitHub 저장소를 연결하면 `main` push 시 자동 배포됨
- 저장소 하위 폴더에 있으면 Root Directory를 `frontend`로 지정
- Vercel 프로젝트 설정에 환경 변수를 등록하고, 바꾼 뒤에는 재배포함
- `vercel.json`이 SPA 새로고침 404와 Service Worker 캐시를 처리함

## 작업 규칙

- 프론트는 1인 작업이라 `main` 브랜치에서 바로 작업함
- `main`에 push하면 Vercel이 자동 배포하므로, 시연 전날부터는 `npm run build`와 `npm run lint`가 통과한 뒤에만 push함

### 커밋 메시지

```
feat: 기능 추가
fix: 버그 수정
style: 화면 스타일 수정
refactor: 코드 정리
docs: 문서 수정
chore: 설정·패키지 변경
```

## 문서

- [프론트엔드 개발 명세서](docs/frontend-spec.md)
- 백엔드 API 명세: `api-spec.md`, `api-detail.md`