/** Small honest pill on every boundary that is simulated. */
export function MockBadge({ label = "Mock" }: { label?: string }) {
  return (
    <span className="mock-badge inline-flex items-center rounded-sm border border-dashed border-muted/60 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-muted align-middle">
      {label}
    </span>
  );
}
