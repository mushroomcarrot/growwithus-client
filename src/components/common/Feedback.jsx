export function LoadingSpinner({ label = '불러오고 있어요', large = false }) {
  return (
    <div role="status" className="flex flex-1 flex-col items-center justify-center gap-3 py-16">
      <span
        className="h-9 w-9 animate-spin rounded-full border-4 border-leaf-light border-t-leaf"
        aria-hidden="true"
      />
      <span className={large ? 'text-lg text-sub' : 'text-sm text-sub'}>{label}</span>
    </div>
  );
}

export function ErrorBox({ message, onRetry, large = false }) {
  return (
    <div role="alert" className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
      <p className={large ? 'text-xl font-bold' : 'text-[15px] font-bold'}>{message ?? '잠시 후 다시 시도해 주세요.'}</p>
      {onRetry && (
        <button
          type="button"
          onClick={() => onRetry()}
          className={`rounded-2xl border-[1.5px] border-[#D9D3C4] bg-white px-5 font-bold ${large ? 'h-14 text-lg' : 'h-11 text-sm'}`}
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, description, large = false }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16 text-center">
      <p className={large ? 'text-2xl font-extrabold' : 'text-base font-bold'}>{title}</p>
      {description && <p className={large ? 'text-lg text-sub' : 'text-sm text-sub'}>{description}</p>}
    </div>
  );
}

export function FieldError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-[13px] font-medium text-[#B53A2E]">
      {children}
    </p>
  );
}
