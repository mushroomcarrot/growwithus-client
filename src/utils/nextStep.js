export const NEXT_STEP_PATH = {
  ROLE_SELECT: '/role',
  PROFILE_OWNER: '/profile/owner',
  PROFILE_CARE: '/profile/caretaker',
  OWNER_HOME: '/owner',
  CARE_TODAY: '/caretaker',
};

export function pathForNextStep(nextStep, role) {
  // ADMIN은 주인·관리사 화면 권한이 없어 시연 화면으로 보냄 (먼저 확인해야 /owner ↔ / 무한 이동이 안 생김)
  if (role === 'ADMIN') return '/demo';
  if (NEXT_STEP_PATH[nextStep]) return NEXT_STEP_PATH[nextStep];
  if (role === 'OWNER') return '/owner';
  if (role === 'CARETAKER') return '/caretaker';
  return '/role';
}