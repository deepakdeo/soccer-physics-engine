interface InfoTooltipProps {
  content: string;
}

export function InfoTooltip({ content }: InfoTooltipProps) {
  return (
    <div className="group relative inline-flex items-center">
      <button
        type="button"
        aria-label="Show explanation"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--line)] bg-white/85 text-[11px] font-bold text-[var(--muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] focus:border-[var(--accent)] focus:text-[var(--accent)] focus:outline-none"
      >
        ?
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-3 hidden w-72 -translate-x-1/2 rounded-[18px] border border-[var(--line)] bg-[rgba(10,31,22,0.94)] px-3 py-3 text-left text-xs leading-5 text-white shadow-[0_18px_40px_rgba(10,31,22,0.2)] group-hover:block group-focus-within:block">
        {content}
      </div>
    </div>
  );
}
