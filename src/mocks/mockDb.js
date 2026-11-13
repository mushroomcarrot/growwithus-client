// 목업 모드용 가짜 서버 데이터.
// 데모 페이지의 주인·관리사 iframe이 같은 데이터를 보도록 localStorage에 저장함 (같은 출처끼리 공유).

const KEY = 'daesin-mock-db-v1';

const pad = (n) => String(n).padStart(2, '0');
export const dateStr = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const isoAt = (d, h, m = 0) =>
  `${dateStr(d)}T${pad(h)}:${pad(m)}:00+09:00`;
export const daysFromToday = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};
export const nowIso = () => {
  const d = new Date();
  return isoAt(d, d.getHours(), d.getMinutes());
};

export function nextSaturday(from = new Date()) {
  const d = new Date(from);
  const diff = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d;
}

export const FARMS = [
  {
    farmId: 'farm_theme',
    name: '농촌테마파크 주말농장',
    district: 'CHEOIN',
    address: '경기도 용인시 처인구 원삼면 농촌파크로 80-1',
    area: '처인구 원삼면',
    latitude: 37.1961,
    longitude: 127.3044,
    distanceKm: 18.4,
    caretaker: { caretakerId: 'crt_soonja', name: '박순자', avatarUrl: null },
  },
  {
    farmId: 'farm_clean',
    name: '용인청정팜',
    district: 'CHEOIN',
    address: '경기도 용인시 처인구 원삼면 미평리 457',
    area: '처인구 원삼면 미평리',
    latitude: 37.18,
    longitude: 127.33,
    distanceKm: 21.2,
    caretaker: { caretakerId: 'crt_youngja', name: '김영자', avatarUrl: null },
  },
  {
    farmId: 'farm_forest',
    name: '포레스트벨',
    district: 'CHEOIN',
    address: '경기도 용인시 처인구 원삼면 맹리로 85-1',
    area: '처인구 원삼면 맹리',
    latitude: 37.17,
    longitude: 127.29,
    distanceKm: 23.6,
    caretaker: { caretakerId: 'crt_malsoon', name: '이말순', avatarUrl: null },
  },
];

export const CROP = { cropId: 'crop_cherry_tomato', name: '방울토마토', characterName: '토순이' };

export const WEATHER_INFO = {
  SUNNY: {
    temperature: 23,
    rainProbability: 10,
    animation: 'sunny_happy',
    mood: 'HAPPY',
    notice: null,
    summary: '맑고 따뜻해요. 계획대로 물 주기를 진행했어요.',
  },
  RAIN: {
    temperature: 17,
    rainProbability: 80,
    animation: 'rain_umbrella',
    mood: 'CALM',
    notice: '오후에 비가 와요. 물은 안 주셔도 돼요.',
    summary: '비 예보로 오늘 물 주기는 쉬어요.',
  },
  HOT: {
    temperature: 31,
    rainProbability: 0,
    animation: 'hot_sweat',
    mood: 'CALM',
    notice: '오늘 더워요. 물은 해 지기 전에 넉넉히 주세요.',
    summary: '더운 날이라 물을 넉넉히 줬어요.',
  },
};

export function characterMessage(weather, stage) {
  if (weather === 'RAIN') return '비가 와서 오늘은 푹 쉬어요';
  if (weather === 'HOT') return '더워요… 물 한 모금 주세요';
  if (stage === 'FRUIT') return '열매가 빨갛게 익어 가요';
  if (stage === 'FLOWER') return '햇살 좋다! 꽃이 활짝 폈어요';
  if (stage === 'SPROUT') return '새싹이 쑥쑥 자라요';
  return '흙 속에서 잠깐 쉬고 있어요';
}

// 성장 단계별 주 작업 (방울토마토 기준)
const STAGE_TASKS = {
  SEED: {
    type: 'CHECK',
    title: '흙 살펴보기',
    description: '씨앗 심은 자리 흙이 파이거나 마르지 않았는지 봐 주세요.',
    minutes: 5,
  },
  SPROUT: {
    type: 'WEED',
    title: '새싹 옆 잡초 뽑기',
    description: '새싹 둘레에 난 잡초를 살살 뽑아 주세요.',
    minutes: 10,
  },
  FLOWER: {
    type: 'SUPPORT',
    title: '지지대 묶어주기',
    description: '줄기가 기울었어요. 줄기 3개를 지지대에 묶어 주세요.',
    minutes: 10,
  },
  FRUIT: {
    type: 'HARVEST_PREP',
    title: '익은 열매 살펴보기',
    description: '빨갛게 익은 방울토마토가 몇 개인지 봐 주세요.',
    minutes: 10,
  },
};

const WATER_DESC = {
  SEED: '씨앗이 마르지 않게 흙을 촉촉하게 적셔 주세요.',
  SPROUT: '새싹이 쓰러지지 않게 뿌리 쪽에 살살 주세요.',
  FLOWER: '뿌리 쪽에 천천히 물을 주세요.',
  FRUIT: '열매가 갈라지지 않게 조금만 주세요.',
};

// 날씨와 성장 단계에 따라 오늘 작업을 만듦 (AI 작업 생성 흉내)
export function generateTasks(weather, gardens) {
  const date = dateStr(new Date());
  const list = [];
  const b14 = gardens.gdn_b14;
  const stage = b14?.stage ?? 'FLOWER';
  const main = STAGE_TASKS[stage];
  const b14Tasks = [
    {
      taskId: `tsk_${date}_b14_${main.type.toLowerCase()}`,
      ...main,
      status: 'TODO',
    },
  ];
  // 비가 오면 AI가 물 주기를 뺌
  if (weather !== 'RAIN') {
    b14Tasks.push({
      taskId: `tsk_${date}_b14_water`,
      type: 'WATER',
      title: '물 주기',
      description: WATER_DESC[stage],
      minutes: 5,
      status: 'TODO',
    });
  }
  list.push({
    gardenId: 'gdn_b14',
    plotCode: 'B-14',
    cropName: '방울토마토',
    ownerNickname: '민지네',
    tasks: b14Tasks,
    stageCheck: {
      required: stage !== 'FRUIT',
      expectedStage: { SEED: 'SPROUT', SPROUT: 'FLOWER', FLOWER: 'FRUIT' }[stage] ?? null,
    },
  });
  list.push({
    gardenId: 'gdn_b15',
    plotCode: 'B-15',
    cropName: '상추',
    ownerNickname: '하준이네',
    tasks: [
      {
        taskId: `tsk_${date}_b15_weed`,
        type: 'WEED',
        title: '잡초 뽑기',
        description: '상추 사이에 난 잡초를 뽑아 주세요.',
        minutes: 15,
        status: 'TODO',
      },
    ],
    stageCheck: { required: false, expectedStage: null },
  });
  list.push({
    gardenId: 'gdn_b16',
    plotCode: 'B-16',
    cropName: '가지',
    ownerNickname: '서연이네',
    tasks: [
      {
        taskId: `tsk_${date}_b16_check`,
        type: 'CHECK',
        title: '열매 살펴보기',
        description: '가지가 몇 개 열렸는지 봐 주세요.',
        minutes: 5,
        status: 'TODO',
      },
    ],
    stageCheck: { required: false, expectedStage: null },
  });

  const totalMinutes = list.reduce((sum, g) => sum + g.tasks.reduce((s, t) => s + t.minutes, 0), 0);
  return {
    date,
    weatherNotice: WEATHER_INFO[weather].notice,
    skippedTypes: weather === 'RAIN' ? ['WATER'] : [],
    totalMinutes,
    gardens: list,
  };
}

export function createInitialDb() {
  const gardens = {
    gdn_b14: {
      gardenId: 'gdn_b14',
      farmId: 'farm_theme',
      plotCode: 'B-14',
      ownerUsername: 'minji',
      nickname: '민지네',
      crop: CROP,
      stage: 'FLOWER',
      dDay: 18,
      daysCaredTogether: 63,
      careLogCount: 41,
      streak: { days: 12, cheeredToday: false },
      xp: { total: 340, today: 0 },
      heartsSent: 27,
    },
  };

  const yesterday = daysFromToday(-1);
  return {
    version: 1,
    weather: 'SUNNY',
    users: {
      minji: {
        userId: 'usr_minji',
        name: '김민지',
        username: 'minji',
        role: 'OWNER',
        owner: { nickname: '민지네', district: 'SUJI', gardenId: 'gdn_b14', familySize: 3 },
        caretaker: null,
      },
      soonja: {
        userId: 'usr_soonja',
        name: '박순자',
        username: 'soonja',
        role: 'CARETAKER',
        owner: null,
        caretaker: { caretakerId: 'crt_soonja', name: '박순자', farmId: 'farm_theme', avatarUrl: null },
      },
      admin: {
        userId: 'usr_admin',
        name: '시연 관리자',
        username: 'admin',
        role: 'ADMIN',
        owner: null,
        caretaker: null,
      },
    },
    gardens,
    careLogs: [
      {
        careLogId: 'cl_prev_01',
        gardenId: 'gdn_b14',
        date: dateStr(yesterday),
        createdAt: isoAt(yesterday, 9, 40),
        taskTypes: ['WATER'],
        summary: '흙이 충분히 촉촉해질 만큼 물을 줬어요.',
        transcript: '물 듬뿍 줬어. 토순이 잘 크고 있어.',
        photoUrl: null,
        caretakerName: '박순자',
        hearted: true,
      },
    ],
    diaryExtras: [
      {
        type: 'STAGE_CHANGE',
        gardenId: 'gdn_b14',
        date: dateStr(daysFromToday(-5)),
        fromStage: 'SPROUT',
        toStage: 'FLOWER',
      },
      {
        type: 'REST_DAY',
        gardenId: 'gdn_b14',
        date: dateStr(daysFromToday(-6)),
        message: '흙이 촉촉해서 오늘은 쉬어 가는 날이었어요.',
      },
    ],
    events: [],
    visits: [],
    photos: {},
    voiceMemos: {},
    quests: [
      { questId: 'qst_heart', title: '할머니께 감사 하트 보내기', progress: 1, goal: 1, rewardXp: 20, status: 'COMPLETED' },
      { questId: 'qst_cheer7', title: '7일 연속 응원하기', progress: 5, goal: 7, rewardXp: 50, status: 'IN_PROGRESS' },
      { questId: 'qst_photo3', title: '관리 사진 3번 보기', progress: 3, goal: 3, rewardXp: 30, status: 'CLAIMED' },
    ],
    today: generateTasks('SUNNY', gardens),
  };
}

export function readDb() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const db = JSON.parse(raw);
      // 날짜가 바뀌면 오늘 할 일을 새로 만듦
      if (db.today?.date !== dateStr(new Date())) {
        db.today = generateTasks(db.weather, db.gardens);
        writeDb(db);
      }
      return db;
    }
  } catch {
    // 손상된 데이터는 초기화
  }
  const db = createInitialDb();
  writeDb(db);
  return db;
}

export function writeDb(db) {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // 저장 공간 초과 시 사진 데이터부터 비움
    db.photos = {};
    db.careLogs = db.careLogs.map((c) => ({ ...c, photoUrl: c.photoUrl?.startsWith('data:') ? '/mock/care-b14.jpg' : c.photoUrl }));
    localStorage.setItem(KEY, JSON.stringify(db));
  }
}

export function updateDb(fn) {
  const db = readDb();
  const result = fn(db);
  writeDb(db);
  return result;
}

export function resetDb() {
  const fresh = createInitialDb();
  // 새로 가입한 사용자는 유지
  const prev = readDb();
  Object.entries(prev.users).forEach(([username, user]) => {
    if (!fresh.users[username]) fresh.users[username] = user;
  });
  Object.entries(prev.gardens).forEach(([id, garden]) => {
    if (!fresh.gardens[id]) fresh.gardens[id] = garden;
  });
  writeDb(fresh);
  return fresh;
}