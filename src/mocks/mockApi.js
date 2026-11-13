// 백엔드 명세(api-detail.md)의 응답 data 형태를 그대로 흉내 내는 목업 API
import { useAuthStore } from '../store/authStore';
import { toError } from '../services/apiError';
import {
  CROP,
  FARMS,
  WEATHER_INFO,
  characterMessage,
  dateStr,
  daysFromToday,
  generateTasks,
  nextSaturday,
  nowIso,
  readDb,
  resetDb,
  updateDb,
} from './mockDb';

const wait = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));
const clone = (v) => structuredClone(v);

async function respond(fn, ms) {
  await wait(ms);
  return clone(fn());
}

function currentUsername() {
  const token = useAuthStore.getState().accessToken;
  if (!token?.startsWith('mock-token-')) throw toError('C4013');
  return token.replace('mock-token-', '');
}

function computeNextStep(user) {
  if (user.role === 'ADMIN') return 'OWNER_HOME';
  if (user.role === 'OWNER') return user.owner ? 'OWNER_HOME' : 'PROFILE_OWNER';
  if (user.role === 'CARETAKER') return user.caretaker ? 'CARE_TODAY' : 'PROFILE_CARE';
  return 'ROLE_SELECT';
}

function tokensFor(user) {
  return {
    userId: user.userId,
    accessToken: `mock-token-${user.username}`,
    refreshToken: `mock-refresh-${user.username}`,
    expiresIn: 3600,
    role: user.role,
    nextStep: computeNextStep(user),
  };
}

function findGarden(db, gardenId) {
  const garden = db.gardens[gardenId];
  if (!garden) throw toError('C404');
  return garden;
}

function farmCaretaker(farmId) {
  return FARMS.find((f) => f.farmId === farmId)?.caretaker ?? null;
}

function addEvent(db, garden, toStage) {
  const eventId = `evt_${toStage.toLowerCase()}_${garden.gardenId}_${Date.now()}`;
  db.events.push({
    eventId,
    gardenId: garden.gardenId,
    fromStage: garden.stage,
    toStage,
    occurredAt: nowIso(),
    reward: toStage === 'FRUIT' ? { xp: 100, badgeCode: 'FIRST_FRUIT' } : { xp: 30, badgeCode: null },
    acked: false,
  });
  db.diaryExtras.push({
    type: 'STAGE_CHANGE',
    gardenId: garden.gardenId,
    date: dateStr(new Date()),
    createdAt: nowIso(),
    fromStage: garden.stage,
    toStage,
  });
  garden.stage = toStage;
  return eventId;
}

// ---------- User ----------
export const mockAuth = {
  signup: ({ name, username }) =>
    respond(() =>
      updateDb((db) => {
        if (db.users[username]) throw toError('C4092');
        const user = { userId: `usr_${username}`, name, username, role: 'USER', owner: null, caretaker: null };
        db.users[username] = user;
        return tokensFor(user);
      })
    ),
  checkUsername: (username) =>
    respond(() => ({ username, available: !readDb().users[username] })),
  // 목업에서는 비밀번호를 확인하지 않음 (시연 계정: minji, soonja, admin)
  login: ({ username }) =>
    respond(() => {
      const user = readDb().users[username];
      if (!user) throw toError('C4041');
      return tokensFor(user);
    }),
  logout: () => respond(() => null, 100),
};

export const mockUser = {
  getMe: () =>
    respond(() => {
      const user = readDb().users[currentUsername()];
      if (!user) throw toError('C4041');
      return { ...user, nextStep: computeNextStep(user) };
    }, 150),
  setRole: (role) =>
    respond(() =>
      updateDb((db) => {
        if (!['OWNER', 'CARETAKER'].includes(role)) throw toError('C002');
        const user = db.users[currentUsername()];
        user.role = role;
        const t = tokensFor(user);
        return { role, accessToken: t.accessToken, refreshToken: t.refreshToken, nextStep: t.nextStep };
      })
    ),
};

// ---------- Farm, Profile ----------
export const mockFarm = {
  getFarms: () =>
    respond(() => ({
      items: FARMS.map(({ caretaker: _c, area: _a, ...farm }) => farm),
      nextCursor: null,
    })),
  previewPlot: (farmId, plotCode) =>
    respond(() => {
      const db = readDb();
      const farm = FARMS.find((f) => f.farmId === farmId);
      const code = plotCode.trim().toUpperCase();
      if (!farm || !/^[A-Z]-\d{1,3}$/.test(code)) throw toError('C404');
      const me = currentUsername();
      const taken = Object.values(db.gardens).find(
        (g) => g.farmId === farmId && g.plotCode === code && g.ownerUsername !== me
      );
      if (taken) throw toError('C4093');
      return { farmId, plotCode: code, available: true, crop: CROP, caretaker: farm.caretaker, monthlyFee: 30000 };
    }),
};

export const mockProfile = {
  createOwnerProfile: ({ nickname, district, farmId, plotCode }) =>
    respond(() =>
      updateDb((db) => {
        const username = currentUsername();
        const user = db.users[username];
        if (user.owner) throw toError('C4094');
        const code = plotCode.trim().toUpperCase();
        const gardenId = `gdn_${username}_${code.replace('-', '').toLowerCase()}`;
        db.gardens[gardenId] = {
          gardenId,
          farmId,
          plotCode: code,
          ownerUsername: username,
          nickname,
          crop: CROP,
          stage: 'SEED',
          dDay: 80,
          daysCaredTogether: 0,
          careLogCount: 0,
          streak: { days: 0, cheeredToday: false },
          xp: { total: 0, today: 0 },
          heartsSent: 0,
        };
        const caretaker = farmCaretaker(farmId);
        db.diaryExtras.push({
          type: 'REST_DAY',
          gardenId,
          date: dateStr(new Date()),
          createdAt: nowIso(),
          message: `텃밭이 연결됐어요. ${caretaker?.name ?? '관리사'} 님이 돌봐 주실 거예요.`,
        });
        user.role = 'OWNER';
        user.owner = { nickname, district, gardenId, familySize: null };
        return { gardenId, characterName: CROP.characterName, stage: 'SEED', nextStep: 'OWNER_HOME' };
      })
    ),
  updateOwnerProfile: (patch) =>
    respond(() =>
      updateDb((db) => {
        const user = db.users[currentUsername()];
        user.owner = { ...user.owner, ...patch };
        return { nickname: user.owner.nickname, district: user.owner.district, gardenId: user.owner.gardenId };
      })
    ),
  createCaretakerProfile: ({ name, farmId, characterId }) =>
    respond(() =>
      updateDb((db) => {
        const username = currentUsername();
        const user = db.users[username];
        if (user.caretaker) throw toError('C4094');
        const caretakerId = `crt_${username}`;
        user.role = 'CARETAKER';
        user.caretaker = { caretakerId, name, farmId, avatarUrl: null, characterId: characterId ?? 'grandma1' };
        return { caretakerId, name, farmId, nextStep: 'CARE_TODAY' };
      })
    ),
};

// ---------- Home, Diary, Game ----------
function homeOf(db, garden) {
  const info = WEATHER_INFO[db.weather];
  const logs = db.careLogs
    .filter((c) => c.gardenId === garden.gardenId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const recent = logs[0] ?? null;
  const expected = daysFromToday(garden.dDay);
  return {
    gardenId: garden.gardenId,
    farmName: FARMS.find((f) => f.farmId === garden.farmId)?.name ?? '',
    plotCode: garden.plotCode,
    nickname: garden.nickname,
    character: {
      name: garden.crop.characterName,
      cropName: garden.crop.name,
      stage: garden.stage,
      level: ['SEED', 'SPROUT', 'FLOWER', 'FRUIT'].indexOf(garden.stage) + 1,
      mood: info.mood,
      animation: info.animation,
      message: characterMessage(db.weather, garden.stage),
    },
    weather: {
      condition: db.weather,
      temperature: info.temperature,
      rainProbability: info.rainProbability,
      area: FARMS.find((f) => f.farmId === garden.farmId)?.area ?? '처인구',
      updatedAt: nowIso(),
    },
    streak: garden.streak,
    xp: garden.xp,
    harvest: { expectedDate: dateStr(expected), dDay: garden.dDay },
    caretaker: farmCaretaker(garden.farmId),
    recentCareLog: recent && {
      careLogId: recent.careLogId,
      summary: recent.summary,
      taskTypes: recent.taskTypes,
      photoUrl: recent.photoUrl,
      createdAt: recent.createdAt,
      hearted: recent.hearted,
    },
    hasUnreadEvent: db.events.some((e) => e.gardenId === garden.gardenId && !e.acked),
  };
}

export const mockHome = {
  getHome: (gardenId) => respond(() => homeOf(readDb(), findGarden(readDb(), gardenId)), 200),
  cheer: (gardenId) =>
    respond(() =>
      updateDb((db) => {
        const garden = findGarden(db, gardenId);
        if (garden.streak.cheeredToday) throw toError('C4095');
        garden.streak = { days: garden.streak.days + 1, cheeredToday: true };
        garden.xp = { total: garden.xp.total + 10, today: garden.xp.today + 10 };
        const quest = db.quests.find((q) => q.questId === 'qst_cheer7');
        if (quest && quest.status === 'IN_PROGRESS') {
          quest.progress = Math.min(quest.goal, quest.progress + 1);
          if (quest.progress >= quest.goal) quest.status = 'COMPLETED';
        }
        return { streakDays: garden.streak.days, xpGained: 10, totalXp: garden.xp.total, mood: 'HAPPY' };
      })
    ),
  sendHeart: (careLogId) =>
    respond(() =>
      updateDb((db) => {
        const log = db.careLogs.find((c) => c.careLogId === careLogId);
        if (!log) throw toError('C404');
        if (log.hearted) throw toError('C4095');
        log.hearted = true;
        const garden = db.gardens[log.gardenId];
        if (garden) {
          garden.xp = { total: garden.xp.total + 5, today: garden.xp.today + 5 };
          garden.heartsSent += 1;
        }
        return { careLogId, hearted: true, xpGained: 5 };
      })
    ),
  getEvents: (gardenId) =>
    respond(
      () =>
        readDb()
          .events.filter((e) => e.gardenId === gardenId && !e.acked)
          .map(({ acked: _a, gardenId: _g, ...e }) => e),
      150
    ),
  ackEvent: (eventId) =>
    respond(() =>
      updateDb((db) => {
        const event = db.events.find((e) => e.eventId === eventId);
        if (!event) throw toError('C404');
        if (event.acked) throw toError('C4095');
        event.acked = true;
        const garden = db.gardens[event.gardenId];
        garden.xp = { total: garden.xp.total + event.reward.xp, today: garden.xp.today + event.reward.xp };
        return {
          eventId,
          xpGained: event.reward.xp,
          totalXp: garden.xp.total,
          badge: event.reward.badgeCode ? { code: event.reward.badgeCode, name: '첫 열매' } : null,
        };
      })
    ),
};

export const mockDiary = {
  getDiary: (gardenId, filter = 'ALL') =>
    respond(() => {
      const db = readDb();
      const logs = db.careLogs
        .filter((c) => c.gardenId === gardenId)
        .map((c) => ({
          type: 'CARE_LOG',
          date: c.date,
          sortKey: c.createdAt,
          careLogId: c.careLogId,
          taskTypes: c.taskTypes,
          summary: c.summary,
          transcript: c.transcript,
          photoUrl: c.photoUrl,
          caretakerName: c.caretakerName,
          createdAt: c.createdAt,
          hearted: c.hearted,
        }));
      const extras = db.diaryExtras
        .filter((e) => e.gardenId === gardenId)
        .map(({ gardenId: _g, ...e }) => ({ ...e, sortKey: e.createdAt ?? `${e.date}T00:00:00+09:00` }));
      let items = [...logs, ...extras].sort((a, b) => b.sortKey.localeCompare(a.sortKey));
      if (filter === 'PHOTO') items = items.filter((i) => i.type === 'CARE_LOG' && i.photoUrl);
      if (filter === 'STAGE') items = items.filter((i) => i.type === 'STAGE_CHANGE');
      return { items: items.map(({ sortKey: _s, ...i }) => i), nextCursor: null };
    }, 250),
};

export const mockQuest = {
  getWeekly: () => respond(() => readDb().quests),
  claim: (questId) =>
    respond(() =>
      updateDb((db) => {
        const quest = db.quests.find((q) => q.questId === questId);
        if (!quest) throw toError('C404');
        if (quest.status === 'CLAIMED') throw toError('C4095');
        if (quest.status !== 'COMPLETED') throw toError('C4004');
        quest.status = 'CLAIMED';
        const garden = db.gardens[db.users[currentUsername()]?.owner?.gardenId];
        if (garden) garden.xp = { total: garden.xp.total + quest.rewardXp, today: garden.xp.today + quest.rewardXp };
        return { questId, xpGained: quest.rewardXp, totalXp: garden?.xp.total ?? 0, status: 'CLAIMED' };
      })
    ),
};

// ---------- Harvest ----------
export const mockHarvest = {
  getHarvest: (gardenId) =>
    respond(() => {
      const db = readDb();
      const garden = findGarden(db, gardenId);
      const expected = daysFromToday(garden.dDay);
      return {
        expectedDate: dateStr(expected),
        dDay: garden.dDay,
        harvestable: garden.stage === 'FRUIT',
        stage: garden.stage,
        daysCaredTogether: garden.daysCaredTogether,
        careLogCount: garden.careLogCount,
        caretakerName: farmCaretaker(garden.farmId)?.name ?? '',
        message: `${expected.getMonth() + 1}월 ${expected.getDate()}일쯤 ${garden.crop.characterName}를 만나러 오세요`,
      };
    }),
  getVisitSlots: (gardenId) =>
    respond(() => {
      const db = readDb();
      const garden = findGarden(db, gardenId);
      const sat = nextSaturday(daysFromToday(Math.max(garden.dDay - 1, 0)));
      const sun = new Date(sat);
      sun.setDate(sat.getDate() + 1);
      const reserved = new Set(db.visits.map((v) => v.slotId));
      return [
        { date: sat, start: '10:00', end: '11:00' },
        { date: sat, start: '14:00', end: '15:00' },
        { date: sun, start: '10:00', end: '11:00' },
      ].map(({ date, start, end }) => {
        const slotId = `slot_${dateStr(date).replaceAll('-', '')}_${start.slice(0, 2)}`;
        return { slotId, date: dateStr(date), startTime: start, endTime: end, available: !reserved.has(slotId) };
      });
    }),
  reserveVisit: ({ gardenId, slotId }) =>
    respond(() =>
      updateDb((db) => {
        if (db.visits.some((v) => v.slotId === slotId)) throw toError('C4096');
        const date = `${slotId.slice(5, 9)}-${slotId.slice(9, 11)}-${slotId.slice(11, 13)}`;
        const startTime = `${slotId.slice(14, 16)}:00`;
        const visit = { visitId: `vst_${slotId}`, gardenId, slotId, date, startTime, status: 'RESERVED' };
        db.visits.push(visit);
        return { visitId: visit.visitId, date, startTime, status: 'RESERVED' };
      })
    ),
  getOutings: () =>
    respond(() => [
      {
        type: 'EXPERIENCE_FARM',
        name: '용인청정팜',
        distanceKm: 3.2,
        address: '경기도 용인시 처인구 원삼면 미평리 457',
        description: '고구마 수확 체험',
      },
      {
        type: 'RESTAURANT',
        name: '원삼메밀집',
        distanceKm: 1.8,
        address: '경기도 용인시 처인구 원삼면 주양대로 1631',
        description: '메밀 막국수',
      },
    ]),
};

// ---------- Task ----------
function caretakerFarmId(db) {
  return db.users[currentUsername()]?.caretaker?.farmId;
}

function findTask(db, taskId) {
  for (const garden of db.today.gardens) {
    const task = garden.tasks.find((t) => t.taskId === taskId);
    if (task) return { garden, task };
  }
  throw toError('C404');
}

function remainingCount(db) {
  return db.today.gardens.reduce((n, g) => n + g.tasks.filter((t) => t.status === 'TODO').length, 0);
}

// 말로 남기기 정리 (STT + LLM 흉내)
// 실제로 말한 내용(spoken)만 가지고 정리함. 알아들을 말이 없으면 작업 이름만 전함.
const ISSUE_WORDS = [
  [/벌레|진딧물|해충|애벌레/, 'PEST_SUSPECTED'],
  [/점이|반점|얼룩/, 'LEAF_SPOT'],
  [/누렇|노랗/, 'YELLOW_LEAF'],
  [/시들|축\s?처|말라 ?죽/, 'WILTING'],
  [/꺾|부러|넘어졌/, 'STEM_DAMAGE'],
];

// 실제 서버 응답과 같은 처리 상태 필드
const READY = { processingStatus: 'READY', retryable: false, processingError: null };

function summarizeVoice(task, spoken) {
  const text = (spoken ?? '').replace(/\s+/g, ' ').trim();
  // 아무 소리도 못 받았으면 인식 실패로 돌려줌 (재시도하면 작업 이름만으로 정리)
  if (!text) {
    return {
      transcript: null,
      summary: null,
      issues: [],
      processingStatus: 'STT_FAILED',
      retryable: true,
      processingError: 'STT_FAILED',
    };
  }
  const hangul = (text.match(/[가-힣]/g) ?? []).length;
  const filler = /^[아어음으흠에네예응\s~.!?…]*$/.test(text);
  const base = `${task.title} 마쳤어요.`;
  if (hangul < 4 || filler) {
    return { transcript: text, summary: base, issues: [], ...READY };
  }
  const issues = ISSUE_WORDS.filter(([re]) => re.test(text)).map(([, code]) => code);
  return { transcript: text, summary: `${base} 관리사님 말씀: "${text}"`, issues, ...READY };
}

export const mockTask = {
  getToday: () =>
    respond(() => {
      const db = readDb();
      if (caretakerFarmId(db) !== 'farm_theme') {
        return { date: db.today.date, weatherNotice: null, skippedTypes: [], totalMinutes: 0, gardens: [] };
      }
      return db.today;
    }, 250),
  uploadPhoto: (taskId, dataUrl) =>
    respond(
      () =>
        updateDb((db) => {
          const { task } = findTask(db, taskId);
          const photoId = `pht_${task.taskId}`;
          db.photos[photoId] = dataUrl;
          return { photoId, photoUrl: dataUrl, aiCheck: { matched: true, message: '작업한 모습이 잘 보여요' } };
        }),
      700
    ),
  uploadVoice: (taskId, spoken) =>
    respond(
      () =>
        updateDb((db) => {
          const { task } = findTask(db, taskId);
          const sample = summarizeVoice(task, spoken);
          const voiceMemoId = `vm_${task.taskId}`;
          db.voiceMemos[voiceMemoId] = { voiceMemoId, taskId, ...sample, status: 'DRAFT' };
          return { voiceMemoId, ...sample, status: 'DRAFT' };
        }),
      1600
    ),
  retryVoice: (voiceMemoId) =>
    respond(
      () =>
        updateDb((db) => {
          const memo = db.voiceMemos[voiceMemoId];
          if (!memo) throw toError('C404');
          if (memo.processingStatus === 'READY') throw toError('C4095');
          const { task } = findTask(db, memo.taskId);
          Object.assign(memo, { transcript: '', summary: `${task.title} 마쳤어요.`, issues: [], ...READY });
          const { taskId: _t, ...res } = memo;
          return res;
        }),
      1200
    ),
  getLatestVoice: (taskId) =>
    respond(() => {
      const memo = Object.values(readDb().voiceMemos).filter((m) => m.taskId === taskId).pop();
      if (!memo) throw toError('C404');
      const { taskId: _t, ...res } = memo;
      return res;
    }, 200),
  confirmVoice: (voiceMemoId, summary) =>
    respond(() =>
      updateDb((db) => {
        const memo = db.voiceMemos[voiceMemoId];
        if (!memo) throw toError('C404');
        if (!memo.summary && !summary) throw toError('C002');
        if (summary) memo.summary = summary;
        memo.status = 'CONFIRMED';
        return { voiceMemoId, status: 'CONFIRMED' };
      })
    ),
  complete: (taskId, { photoId, voiceMemoId } = {}) =>
    respond(() =>
      updateDb((db) => {
        const { garden, task } = findTask(db, taskId);
        if (task.status === 'DONE') throw toError('C4095');
        task.status = 'DONE';
        let careLogId = null;
        const gardenDone = garden.tasks.every((t) => t.status === 'DONE');
        const owned = db.gardens[garden.gardenId];
        // 텃밭의 마지막 작업이 끝나면 돌봄 기록을 만듦 (주인 일기·홈에 표시)
        if (owned && (gardenDone || photoId || voiceMemoId)) {
          const memo = voiceMemoId ? db.voiceMemos[voiceMemoId] : null;
          const existing = db.careLogs.find((c) => c.gardenId === garden.gardenId && c.date === db.today.date && c.fromToday);
          const caretaker = db.users[currentUsername()]?.caretaker;
          const types = garden.tasks.filter((t) => t.status === 'DONE').map((t) => t.type);
          const done = garden.tasks.filter((t) => t.status === 'DONE').map((t) => t.title);
          const weatherLine = db.weather === 'RAIN' ? ' 비 예보로 물 주기는 쉬었어요.' : '';
          const summary = memo?.summary ?? `${done.join(', ')}까지 마쳤어요.${weatherLine}`;
          if (existing) {
            existing.taskTypes = types;
            if (photoId) existing.photoUrl = db.photos[photoId];
            if (memo) {
              existing.summary = memo.summary;
              existing.transcript = memo.transcript;
            }
            careLogId = existing.careLogId;
          } else {
            careLogId = `cl_${Date.now()}`;
            db.careLogs.push({
              careLogId,
              gardenId: garden.gardenId,
              date: db.today.date,
              createdAt: nowIso(),
              taskTypes: types,
              summary: memo ? memo.summary : summary,
              transcript: memo?.transcript ?? null,
              photoUrl: photoId ? db.photos[photoId] : null,
              caretakerName: caretaker?.name ?? '박순자',
              hearted: false,
              fromToday: true,
            });
            owned.careLogCount += 1;
          }
        }
        return {
          taskId,
          status: 'DONE',
          careLogId,
          remainingTasks: remainingCount(db),
          stageCheck: { required: gardenDone && garden.stageCheck.required, gardenId: garden.gardenId },
        };
      })
    ),
  checkStage: (gardenId, observed) =>
    respond(() =>
      updateDb((db) => {
        const garden = db.gardens[gardenId];
        const todayGarden = db.today.gardens.find((g) => g.gardenId === gardenId);
        if (todayGarden) todayGarden.stageCheck.required = false;
        if (!garden) return { stage: observed, calibrated: false, calibratedAt: nowIso(), eventId: null };
        const order = ['SEED', 'SPROUT', 'FLOWER', 'FRUIT'];
        let eventId = null;
        if (observed !== 'NO_CHANGE' && order.indexOf(observed) > order.indexOf(garden.stage)) {
          eventId = addEvent(db, garden, observed);
          if (observed === 'FRUIT') garden.dDay = Math.min(garden.dDay, 7);
        }
        return { stage: garden.stage, calibrated: true, calibratedAt: nowIso(), eventId };
      })
    ),
  getHeartsForToday: () =>
    respond(() => {
      const db = readDb();
      return db.careLogs.filter((c) => c.date === db.today.date && c.hearted).length;
    }, 150),
};

// ---------- Demo ----------
// 날씨·단계가 바뀌면 오늘 할 일을 다시 만들되, 이미 끝낸 작업과 단계 확인은 유지함
function regenerateToday(db) {
  const doneIds = new Set(db.today.gardens.flatMap((g) => g.tasks.filter((t) => t.status === 'DONE').map((t) => t.taskId)));
  const checked = new Set(db.today.gardens.filter((g) => !g.stageCheck.required).map((g) => g.gardenId));
  db.today = generateTasks(db.weather, db.gardens);
  db.today.gardens.forEach((g) => {
    g.tasks.forEach((t) => {
      if (doneIds.has(t.taskId)) t.status = 'DONE';
    });
    if (checked.has(g.gardenId)) g.stageCheck.required = false;
  });
}

export const mockDemo = {
  getState: () =>
    respond(() => {
      const db = readDb();
      const garden = db.gardens.gdn_b14;
      const order = ['SEED', 'SPROUT', 'FLOWER', 'FRUIT'];
      return {
        weather: db.weather,
        stage: garden.stage,
        stageProgress: `${order.indexOf(garden.stage) + 1}/4`,
        fastForwardDays: garden.dDay,
        todayTaskGardens: db.today.gardens.length,
      };
    }, 150),
  setWeather: (condition) =>
    respond(() =>
      updateDb((db) => {
        db.weather = condition;
        regenerateToday(db);
        return {
          condition,
          animation: WEATHER_INFO[condition].animation,
          weatherNotice: WEATHER_INFO[condition].notice,
          regeneratedTasks: db.today.gardens.length,
        };
      })
    ),
  // 시연용: 성장 단계를 직접 바꿈 (올리면 진화 이벤트, 내리면 조용히 바꿈)
  setStage: (stage) =>
    respond(() =>
      updateDb((db) => {
        const order = ['SEED', 'SPROUT', 'FLOWER', 'FRUIT'];
        if (!order.includes(stage)) throw toError('C002');
        const garden = db.gardens.gdn_b14;
        let eventId = null;
        if (order.indexOf(stage) > order.indexOf(garden.stage)) {
          eventId = addEvent(db, garden, stage);
        } else {
          garden.stage = stage;
          db.events.forEach((e) => {
            if (e.gardenId === 'gdn_b14') e.acked = true;
          });
        }
        const D_DAY = { SEED: 80, SPROUT: 55, FLOWER: 18 };
        garden.dDay = D_DAY[stage] ?? Math.round((nextSaturday() - new Date()) / 86400000);
        // 단계가 바뀌면 그 단계에 맞는 작업으로 다시 만듦 (단계 확인도 다시 받음)
        db.today.gardens.forEach((g) => {
          if (g.gardenId === 'gdn_b14') g.stageCheck.required = true;
        });
        regenerateToday(db);
        return { stage, eventId, expectedHarvestDate: dateStr(daysFromToday(garden.dDay)) };
      })
    ),
  fastForward: (days) =>
    respond(() =>
      updateDb((db) => {
        const garden = db.gardens.gdn_b14;
        let eventId = null;
        if (garden.stage !== 'FRUIT') eventId = addEvent(db, garden, 'FRUIT');
        const sat = nextSaturday();
        garden.dDay = Math.round((sat - new Date()) / 86400000);
        garden.daysCaredTogether += days;
        regenerateToday(db);
        return { stage: 'FRUIT', eventId, expectedHarvestDate: dateStr(sat) };
      })
    ),
  reset: () =>
    respond(() => {
      const db = resetDb();
      return { weather: db.weather, stage: db.gardens.gdn_b14.stage, todayTaskGardens: db.today.gardens.length };
    }),
};