export function TextField({ label, error, hint, large = false, children, ...props }) {
  return (
    <label className={`flex flex-col gap-1.5 font-bold ${large ? 'text-[19px]' : 'text-sm'}`}>
      {label}
      {children ?? (
        <input
          {...props}
          className={`box-border w-full rounded-[14px] border-[1.5px] bg-white px-4 font-normal text-ink ${
            error ? 'border-[#B53A2E]' : 'border-[#D9D3C4]'
          } ${large ? 'h-16 text-[22px] font-bold' : 'h-[54px] text-base'}`}
        />
      )}
      {hint && !error && <span className="text-xs font-normal text-muted">{hint}</span>}
      {error && (
        <span role="alert" className="text-[13px] font-medium text-[#B53A2E]">
          {error}
        </span>
      )}
    </label>
  );
}

export function PrimaryButton({ children, large = false, className = '', ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`flex items-center justify-center rounded-2xl bg-leaf font-extrabold text-white disabled:opacity-50 ${
        large ? 'h-[68px] rounded-[20px] text-[22px] shadow-[0_4px_0_#3A6E30]' : 'h-14 text-[17px]'
      } ${className}`}
    >
      {children}
    </button>
  );
}
