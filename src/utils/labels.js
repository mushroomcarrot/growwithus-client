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

// 백엔드 voice-api.md의 고정 표
export const ISSUE_LABEL = {
  LEAF_SPOT: '잎에 점이 있어요',
  YELLOW_LEAF: '잎이 노랗게 보여요',
  WILTING: '작물이 시들어 보여요',
  PEST_SUSPECTED: '벌레가 보인다는 기록이 있어요',
  STEM_DAMAGE: '줄기가 손상된 것 같아요',
};

export const issueLabel = (code) => ISSUE_LABEL[code] ?? code;