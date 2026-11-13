import { CaretakerFace } from './Characters';

export default function CaretakerAvatar({ avatarUrl, characterId, size = 44, name }) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ? `${name} 님` : ''}
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span className="shrink-0" style={{ width: size, height: size }}>
      <CaretakerFace characterId={characterId} size={size} />
    </span>
  );
}
