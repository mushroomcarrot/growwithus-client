export const NEXT_STEP_PATH = {
  ROLE_SELECT: '/role',
  PROFILE_OWNER: '/profile/owner',
  PROFILE_CARE: '/profile/caretaker',
  OWNER_HOME: '/owner',
  CARE_TODAY: '/caretaker',
};

export function pathForNextStep(nextStep, role) {
  if (NEXT_STEP_PATH[nextStep]) return NEXT_STEP_PATH[nextStep];
  if (role === 'OWNER') return '/owner';
  if (role === 'CARETAKER') return '/caretaker';
  if (role === 'ADMIN') return '/demo';
  return '/role';
}
