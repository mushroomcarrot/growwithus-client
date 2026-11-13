// 선 아이콘 모음 (장식용은 aria-hidden)
const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

export const IconBack = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.5}>
    <path d="M15 5l-7 7 7 7" />
  </svg>
);

export const IconHome = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M3 11l9-7 9 7" />
    <path d="M5 10v10h14V10" />
  </svg>
);

export const IconBook = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
    <path d="M9 9h6M9 13h4" />
  </svg>
);

export const IconHarvest = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="14" r="7" />
    <path d="M12 7V4M9 5l3 2 3-2" />
  </svg>
);

export const IconUser = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
  </svg>
);

export const IconSpeaker = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 9v6h4l5 4V5L8 9z" />
    <path d="M16 9a4 4 0 0 1 0 6M19 6a8 8 0 0 1 0 12" />
  </svg>
);

export const IconMic = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
  </svg>
);

export const IconCheck = ({ size = 24, strokeWidth = 3 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={strokeWidth}>
    <path d="M5 12l5 5 9-10" />
  </svg>
);

export const IconArrowRight = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base} strokeWidth={2.5}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const IconBell = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" />
    <path d="M10 21h4" />
  </svg>
);

export const IconCloudRain = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M7 15a4 4 0 0 1 .5-8A5 5 0 0 1 17 8a3.5 3.5 0 0 1 0 7z" />
    <path d="M9 18l-1 2M13 18l-1 2M17 18l-1 2" />
  </svg>
);

export const IconSun = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5" />
  </svg>
);

export const IconThermo = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M10 14V4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0z" />
    <path d="M12 10v6" />
  </svg>
);

export const IconChat = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 5h16v11H9l-5 4z" />
  </svg>
);

export const IconCamera = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="3" y="6" width="18" height="14" rx="2" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

export const IconRefresh = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M4 12a8 8 0 1 0 2.5-5.8" />
    <path d="M4 4v4h4" />
  </svg>
);

export const IconFastForward = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 6v12l8-6zM12 6v12l8-6z" fill="currentColor" />
  </svg>
);

export const IconSprout = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M12 21v-9" />
    <path d="M12 12C8 12 5 9 5 5c4 0 7 3 7 7z" />
    <path d="M12 14c4 0 7-3 7-7-4 0-7 3-7 7z" />
  </svg>
);

export const IconFork = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <path d="M7 3v8M5 3v4a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2 6 0 8v10" />
  </svg>
);

export const IconPhone = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...base}>
    <rect x="6" y="2" width="12" height="20" rx="2.5" />
    <path d="M11 18h2" />
  </svg>
);

// 채워진 아이콘
export const Heart = ({ size = 18, color = '#D9507A' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill={color} />
  </svg>
);

export const Flame = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z" fill="#E07A2E" />
  </svg>
);

export const Star = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 2l3 6.5 7 .8-5.2 4.8 1.4 7L12 17.6 5.8 21.1l1.4-7L2 9.3l7-.8z" fill="#3B6FD8" />
  </svg>
);

export const Blossom = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="3.5" fill="#E07A2E" />
    <path
      d="M12 3a3 3 0 0 1 0 6 3 3 0 0 1 0-6zM12 15a3 3 0 0 1 0 6 3 3 0 0 1 0-6zM3 12a3 3 0 0 1 6 0 3 3 0 0 1-6 0zM15 12a3 3 0 0 1 6 0 3 3 0 0 1-6 0z"
      fill="#F7C548"
    />
  </svg>
);

export const MiniTomato = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="14" r="7" fill="#E5483B" />
    <path d="M9 6q3-2 6 0-1.5 1.5-3 0-1.5 1.5-3 0z" fill="#4C8C3F" />
  </svg>
);

export const Kakao = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12 4C7 4 3 7.1 3 11c0 2.5 1.7 4.7 4.2 6l-1 3.6 4.1-2.7c.6.1 1.1.1 1.7.1 5 0 9-3.1 9-7s-4-7-9-7z" fill="#191919" />
  </svg>
);
