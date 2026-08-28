import Link from "next/link";

const STEPS = ["Enter EPIC", "Consent", "Family", "Fix", "Track"] as const;

export function Shell({
  title,
  step,
  children,
  wide = false,
}: {
  title?: string;
  step?: 1 | 2 | 3 | 4 | 5;
  children?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-20">
        <div className={`mx-auto ${wide ? "max-w-3xl" : "max-w-[480px]"} px-4 py-3 flex items-center justify-between gap-3`}>
          <Link href="/" className="font-display font-bold text-xl tracking-tight text-violet uppercase leading-none">
            RollGuard
          </Link>
          {step ? (
            <div className="text-xs text-muted font-mono" aria-label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`}>
              <span className="text-ink">Step {step}</span>/{STEPS.length} · {STEPS[step - 1]}
            </div>
          ) : (
            <span className="text-xs text-muted font-mono">Prototype</span>
          )}
        </div>
        {step && (
          <div className="h-1 bg-line" aria-hidden>
            <div className="h-1 bg-violet transition-[width] duration-500" style={{ width: `${(step / STEPS.length) * 100}%` }} />
          </div>
        )}
      </header>
      <main className={`mx-auto w-full ${wide ? "max-w-3xl" : "max-w-[480px]"} px-4 pb-28 pt-5 flex-1`}>
        {title && <h1 className="font-display font-semibold text-[28px] leading-tight mb-4">{title}</h1>}
        {children}
      </main>
      <footer className="border-t border-line">
        <div className={`mx-auto ${wide ? "max-w-3xl" : "max-w-[480px]"} px-4 py-4 text-xs text-muted flex flex-wrap gap-x-4 gap-y-1`}>
          <span>Not an official ECI product · synthetic data only</span>
          <Link href="/about" className="underline underline-offset-2 hover:text-ink">
            What is real and what is mocked
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** Sticky bottom action bar used on every journey screen. */
export function ActionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur">
      <div className="mx-auto max-w-[480px] px-4 py-3 flex gap-3">{children}</div>
    </div>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`min-h-[48px] flex-1 rounded-md bg-violet px-4 font-display font-semibold text-lg text-white tracking-wide hover:bg-[#3d2169] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`min-h-[48px] rounded-md border border-ink/30 bg-card px-4 font-display font-semibold text-lg text-ink hover:bg-paper disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
