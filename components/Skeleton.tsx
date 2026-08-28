/** Reserved-space placeholders so async screens never jump (CLS) and announce busy state. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-sm border border-line bg-card px-3 pt-3 pb-4 space-y-2" aria-hidden>
      <Skeleton className="h-3 w-40" />
      <div className="flex gap-3 pt-1">
        <Skeleton className="h-12 w-10" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      {Array.from({ length: Math.max(0, lines - 3) }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 3, label = "Loading" }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="space-y-3">
      <span className="sr-only">{label}…</span>
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}
