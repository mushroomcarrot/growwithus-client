import { useUiStore } from '../../store/uiStore';

export default function Toast() {
  const toast = useUiStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      role="status"
      className="animate-pop-in fixed bottom-28 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-ink px-4 py-2.5 text-[13px] font-medium text-white shadow-lg"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9BD57E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 12l5 5 9-10" />
      </svg>
      {toast}
    </div>
  );
}
