// 앱에서 쓰는 일러스트 (디자이너 이미지가 나오면 교체)

export function SproutPot({ size = 104 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 132 132" aria-hidden="true">
      <path d="M66 70 L66 44" stroke="#4C8C3F" strokeWidth="5" strokeLinecap="round" fill="none" />
      <path d="M66 50 C52 50 42 40 40 26 C54 26 64 34 66 50 Z" fill="#6DAA4F" />
      <path d="M66 46 C80 46 90 36 92 22 C78 22 68 30 66 46 Z" fill="#4C8C3F" />
      <rect x="30" y="68" width="72" height="12" rx="4" fill="#9C5A33" />
      <path d="M36 80 L96 80 L88 118 L44 118 Z" fill="#B5683B" />
      <circle cx="56" cy="96" r="3.5" fill="#2A1A14" />
      <circle cx="76" cy="96" r="3.5" fill="#2A1A14" />
      <path d="M60 104 Q66 109 72 104" stroke="#2A1A14" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// 관리사 기본 캐릭터 4종
export const CARETAKER_CHARACTERS = [
  { id: 'grandma1', label: '쪽머리 할머니', hair: '#B9B4AC', bun: true, glasses: false, hat: false },
  { id: 'grandma2', label: '안경 쓴 할머니', hair: '#8F8A82', bun: false, glasses: true, hat: false },
  { id: 'grandpa1', label: '밀짚모자 할아버지', hair: '#CFCAC2', bun: false, glasses: false, hat: true },
  { id: 'grandpa2', label: '안경 쓴 할아버지', hair: '#6E6A64', bun: false, glasses: true, hat: false, bald: true },
];

export function CaretakerFace({ characterId = 'grandma1', size = 44 }) {
  const c = CARETAKER_CHARACTERS.find((x) => x.id === characterId) ?? CARETAKER_CHARACTERS[0];
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" aria-hidden="true">
      <circle cx="22" cy="22" r="22" fill="#FBE3C8" />
      {c.bun && <circle cx="22" cy="10" r="7" fill={c.hair} />}
      {!c.bald && <path d="M9 22c0-9 6-13 13-13s13 4 13 13c-3-4-8-6-13-6s-10 2-13 6z" fill={c.hair} />}
      {c.bald && <path d="M11 23c0-4 1-6 2-7M33 23c0-4-1-6-2-7" stroke={c.hair} strokeWidth="3" strokeLinecap="round" />}
      <circle cx="22" cy="25" r="10" fill="#F6CFA6" />
      {c.glasses ? (
        <g stroke="#3B3424" strokeWidth="1.2" fill="none">
          <circle cx="18" cy="24" r="3" />
          <circle cx="26" cy="24" r="3" />
          <path d="M21 24h2" />
        </g>
      ) : null}
      <circle cx="18" cy="24" r="1.6" fill="#2A1A14" />
      <circle cx="26" cy="24" r="1.6" fill="#2A1A14" />
      <path d="M18.5 29q3.5 3 7 0" stroke="#2A1A14" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      {c.hat && (
        <g>
          <ellipse cx="22" cy="15" rx="17" ry="4" fill="#E8C877" />
          <path d="M14 15c0-6 4-9 8-9s8 3 8 9z" fill="#F2D48A" />
          <path d="M14 13h16" stroke="#C9532E" strokeWidth="2" />
        </g>
      )}
    </svg>
  );
}

export function FamilyFace({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill="#FDE1D3" />
      <circle cx="17" cy="22" r="7" fill="#F6CFA6" />
      <path d="M10 20c0-5 3-8 7-8s7 3 7 8c-2-2-4-3-7-3s-5 1-7 3z" fill="#3A2A20" />
      <circle cx="31" cy="22" r="7" fill="#F6CFA6" />
      <path d="M24 20c0-5 3-8 7-8s7 3 7 8c-2-2-4-3-7-3s-5 1-7 3z" fill="#5A3A28" />
      <path d="M8 40c2-7 6-10 10-10s7 3 8 6c1-3 4-6 6-6 4 0 8 3 10 10" fill="#7BAA5E" />
    </svg>
  );
}

// 열매 달린 토마토 화분 (수확·진화 화면)
export function FruitPlant({ size = 160 }) {
  return (
    <svg width={size} height={size * 1.05} viewBox="0 0 220 230" aria-hidden="true">
      <path d="M110 160V56" stroke="#3E7A33" strokeWidth="6" strokeLinecap="round" />
      <path
        d="M110 120 C90 110 74 96 66 78 M110 100 C128 92 144 80 152 62 M110 140 C128 134 142 124 150 110"
        stroke="#3E7A33"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      <path d="M96 70c-14 0-22-10-24-20 12 0 22 8 24 20zM124 64c14 0 22-10 24-20-12 0-22 8-24 20z" fill="#6DAA4F" />
      <circle cx="66" cy="92" r="18" fill="#E5483B" />
      <circle cx="152" cy="76" r="18" fill="#E5483B" />
      <circle cx="150" cy="124" r="16" fill="#E5483B" />
      <circle cx="60" cy="86" r="4" fill="#F59A8E" />
      <circle cx="146" cy="70" r="4" fill="#F59A8E" />
      <path d="M66 74v-6M152 58v-6M150 108v-6" stroke="#3E7A33" strokeWidth="4" strokeLinecap="round" />
      <rect x="62" y="156" width="96" height="14" rx="5" fill="#9C5A33" />
      <path d="M70 170 L150 170 L140 218 L80 218 Z" fill="#B5683B" />
      <circle cx="98" cy="190" r="4" fill="#2A1A14" />
      <circle cx="122" cy="190" r="4" fill="#2A1A14" />
      <path d="M102 200 Q110 208 118 200" stroke="#2A1A14" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function FlowerBurst({ size = 110 }) {
  return (
    <svg width={size} height={size * 1.1} viewBox="0 0 110 120" aria-hidden="true">
      <path d="M55 64v52" stroke="#3E7A33" strokeWidth="6" strokeLinecap="round" />
      <path d="M55 96c-14 0-22-8-24-18 12 0 22 6 24 18z" fill="#6DAA4F" />
      <g fill="#F7C548">
        <ellipse cx="55" cy="22" rx="14" ry="20" />
        <ellipse cx="55" cy="74" rx="14" ry="20" />
        <ellipse cx="29" cy="48" rx="20" ry="14" />
        <ellipse cx="81" cy="48" rx="20" ry="14" />
        <ellipse cx="37" cy="30" rx="16" ry="12" transform="rotate(45 37 30)" />
        <ellipse cx="73" cy="30" rx="16" ry="12" transform="rotate(-45 73 30)" />
        <ellipse cx="37" cy="66" rx="16" ry="12" transform="rotate(-45 37 66)" />
        <ellipse cx="73" cy="66" rx="16" ry="12" transform="rotate(45 73 66)" />
      </g>
      <circle cx="55" cy="48" r="13" fill="#E07A2E" />
    </svg>
  );
}
