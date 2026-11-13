export const STAGES = ['SEED', 'SPROUT', 'FLOWER', 'FRUIT'];

export const STAGE_LABEL = {
  SEED: '씨앗',
  SPROUT: '새싹',
  FLOWER: '꽃',
  FRUIT: '열매',
};

export const WEATHER_LABEL = {
  SUNNY: '맑음',
  CLOUDY: '흐림',
  RAIN: '비',
  HOT: '더움',
  COLD: '추움',
};

export const DISTRICT_LABEL = {
  SUJI: '수지구',
  GIHEUNG: '기흥구',
  CHEOIN: '처인구',
};

export const TASK_TYPE_LABEL = {
  WATER: '물 주기',
  SUPPORT: '지지대',
  WEED: '잡초 뽑기',
  PRUNE: '곁순 정리',
  FERTILIZE: '거름 주기',
  HARVEST_PREP: '수확 준비',
  CHECK: '살펴보기',
};

// 백엔드에서 최종 목록을 받으면 교체
export const ISSUE_LABEL = {
  LEAF_SPOT: '잎에 점이 있어요',
  PEST: '벌레가 보여요',
  WILT: '잎이 시들었어요',
  DRY_SOIL: '흙이 말랐어요',
  BROKEN_STEM: '줄기가 꺾였어요',
};

export const issueLabel = (code) => ISSUE_LABEL[code] ?? code;
