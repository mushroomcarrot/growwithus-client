import { FruitPlant } from '../common/Characters';

// 성장 단계(stage)와 날씨 애니메이션(animation)에 따라 바뀌는 작물 캐릭터
function Face({ cx = 95, cy = 112, sad = false }) {
  return (
    <g>
      <circle cx={cx - 19} cy={cy - 4} r="6" fill="#2A1A14" />
      <circle cx={cx + 19} cy={cy - 4} r="6" fill="#2A1A14" />
      {sad ? (
        <path d={`M${cx - 11} ${cy + 20} Q${cx} ${cy + 12} ${cx + 11} ${cy + 20}`} stroke="#2A1A14" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      ) : (
        <path d={`M${cx - 11} ${cy + 14} Q${cx} ${cy + 26} ${cx + 11} ${cy + 14}`} stroke="#2A1A14" strokeWidth="4.5" fill="none" strokeLinecap="round" />
      )}
      <ellipse cx={cx - 31} cy={cy + 12} rx="9" ry="6" fill="#F59A8E" />
      <ellipse cx={cx + 31} cy={cy + 12} rx="9" ry="6" fill="#F59A8E" />
    </g>
  );
}

function Tomato({ animation }) {
  const rain = animation === 'rain_umbrella';
  const hot = animation === 'hot_sweat';
  const sad = animation === 'sad_droop';
  const cy = rain ? 122 : 112;
  return (
    <svg width="190" height="190" viewBox="0 0 190 190" aria-hidden="true">
      {animation === 'sunny_happy' && (
        <g>
          <circle cx="150" cy="34" r="14" fill="#F7C548" />
          <path d="M150 12v6M150 50v6M128 34h6M166 34h6M135 19l4 4M161 45l4 4M135 49l4-4M161 23l4-4" stroke="#F7C548" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      {rain && (
        <g>
          <path d="M138 40a12 12 0 0 1 22-6 10 10 0 0 1 14 9 8 8 0 0 1-2 16h-32a10 10 0 0 1-2-19z" fill="#A9B8CA" />
          <g className="animate-fall">
            <path d="M24 30l-3 7M40 58l-3 7M18 86l-3 7M166 100l-3 7M176 132l-3 7" stroke="#8FA6C4" strokeWidth="3" strokeLinecap="round" />
          </g>
        </g>
      )}
      {hot && (
        <g>
          <circle cx="150" cy="34" r="18" fill="#F28B3C" />
          <path d="M150 8v6M150 54v6M124 34h6M170 34h6" stroke="#F28B3C" strokeWidth="3" strokeLinecap="round" />
        </g>
      )}
      <path d={`M95 ${cy - 60} C92 ${cy - 72} 85 ${cy - 78} 76 ${cy - 80}`} stroke="#3E7A33" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="95" cy={cy} rx={rain ? 60 : 64} ry={rain ? 56 : 60} fill="#E5483B" />
      <path d={`M70 ${cy - 54} Q95 ${cy - 70} 120 ${cy - 54} Q106 ${cy - 49} 95 ${cy - 56} Q84 ${cy - 49} 70 ${cy - 54} Z`} fill="#4C8C3F" />
      <ellipse cx="72" cy={cy - 28} rx="12" ry="8" fill="#F27A6E" />
      <Face cy={cy} sad={sad} />
      {hot && (
        <g fill="#7FC4F0">
          <path d="M150 104c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" />
          <path d="M40 92c3 5 5 7 5 10a5 5 0 0 1-10 0c0-3 2-5 5-10z" />
        </g>
      )}
      {rain && (
        <g>
          <path d="M150 66 L150 130" stroke="#5A3A28" strokeWidth="4" strokeLinecap="round" />
          <path d="M150 130 q0 8 -7 8" stroke="#5A3A28" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M30 70 Q95 -6 160 70 Q144 60 127 70 Q111 60 95 70 Q79 60 63 70 Q46 60 30 70 Z" fill="#F7C548" />
          <path d="M95 14 L95 70" stroke="#E0A92E" strokeWidth="2" />
          <path d="M150 130 C140 126 134 130 130 136" stroke="#E5483B" strokeWidth="8" fill="none" strokeLinecap="round" />
        </g>
      )}
      <ellipse cx="95" cy="182" rx="44" ry="6" fill={rain ? '#B9C8D8' : '#C9DCEF'} />
    </svg>
  );
}

function Sprout({ stage }) {
  const big = stage === 'SPROUT';
  return (
    <svg width="170" height="170" viewBox="0 0 132 132" aria-hidden="true">
      {big ? (
        <>
          <path d="M66 70 L66 36" stroke="#4C8C3F" strokeWidth="5" strokeLinecap="round" fill="none" />
          <path d="M66 50 C50 50 38 38 36 22 C52 22 64 32 66 50 Z" fill="#6DAA4F" />
          <path d="M66 44 C82 44 94 32 96 16 C80 16 68 26 66 44 Z" fill="#4C8C3F" />
        </>
      ) : (
        <>
          <path d="M66 70 L66 58" stroke="#4C8C3F" strokeWidth="4" strokeLinecap="round" fill="none" />
          <ellipse cx="66" cy="56" rx="7" ry="5" fill="#8A6A48" />
        </>
      )}
      <rect x="30" y="68" width="72" height="12" rx="4" fill="#9C5A33" />
      <path d="M36 80 L96 80 L88 118 L44 118 Z" fill="#B5683B" />
      <circle cx="56" cy="96" r="3.5" fill="#2A1A14" />
      <circle cx="76" cy="96" r="3.5" fill="#2A1A14" />
      <path d="M60 104 Q66 109 72 104" stroke="#2A1A14" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function CropCharacter({ stage = 'FLOWER', animation = 'sunny_happy' }) {
  if (stage === 'FRUIT') {
    return (
      <div className="animate-float">
        <FruitPlant size={170} />
      </div>
    );
  }
  if (stage === 'FLOWER') {
    return (
      <div className="animate-float">
        <Tomato animation={animation} />
      </div>
    );
  }
  return (
    <div className="animate-float">
      <Sprout stage={stage} />
    </div>
  );
}

export const WEATHER_CARD = {
  sunny_happy: { bg: 'bg-sky', text: 'text-[#2C4A6E]', shadow: '#C9DCEF' },
  rain_umbrella: { bg: 'bg-rain', text: 'text-[#26405E]', shadow: '#B9C8D8' },
  hot_sweat: { bg: 'bg-hot', text: 'text-[#7A3A0C]', shadow: '#F3C9A6' },
  sad_droop: { bg: 'bg-[#E9E6DF]', text: 'text-[#4A5145]', shadow: '#D6D1C6' },
};
