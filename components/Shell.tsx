import Link from "next/link";

const STEPS = ["Enter EPIC", "Consent", "Family", "Fix", "Track"] as const;

export type ShellWidth = "focus" | "workspace" | "wide";

const WIDTH: Record<ShellWidth, string> = {
  focus: "max-w-focus",
  workspace: "max-w-workspace",
  wide: "max-w-wide",
};

const PHASES = [
  { label: "Check", steps: [1, 2] },
  { label: "Review", steps: [3] },
  { label: "Claim", steps: [4] },
  { label: "Track", steps: [5] },
] as const;

export function Shell({
  title,
  step,
  children,
  wide,
  width,
}: {
  title?: string;
  step?: 1 | 2 | 3 | 4 | 5;
  children?: React.ReactNode;
  wide?: boolean;
  width?: ShellWidth;
}) {
  const shellWidth = width ?? (wide ? "wide" : "focus");
  const widthClass = WIDTH[shellWidth];
  const activePhase = step ? PHASES.find((phase) => phase.steps.some((phaseStep) => phaseStep === step)) : undefined;
  return (
    <div className="min-h-dvh flex flex-col">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="border-b border-line bg-paper/95 backdrop-blur sticky top-0 z-20">
        <div className={`mx-auto ${widthClass} px-page py-3 flex items-center justify-between gap-3`}>
          <Link href="/" className="font-display font-bold text-xl tracking-tight text-violet uppercase leading-none rounded-sm">
            RollGuard
          </Link>
          {step ? (
            <>
              <div className="text-xs text-muted font-mono nums sm:hidden" aria-label={`Step ${step} of ${STEPS.length}: ${STEPS[step - 1]}`}>
                Step {step} of {STEPS.length}
              </div>
              <ol className="hidden items-center gap-4 text-xs font-mono text-muted sm:flex" aria-label="Journey progress">
                {PHASES.map((phase) => (
                  <li key={phase.label} aria-current={phase === activePhase ? "step" : undefined} className={phase === activePhase ? "text-ink" : undefined}>
                    {phase.label}
                  </li>
                ))}
              </ol>
            </>
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
      <main id="main" tabIndex={-1} className={`mx-auto w-full ${widthClass} px-page pb-28 pt-5 flex-1 outline-none`}>
        {title && <h1 className="font-display font-semibold text-[28px] leading-tight mb-4">{title}</h1>}
        {children}
      </main>
      <footer className="border-t border-line">
        <div className={`mx-auto ${widthClass} px-page py-4 text-xs text-muted flex flex-wrap gap-x-4 gap-y-1`}>
          <span>Not an official Election Commission product · synthetic data only</span>
          <Link href="/about" className="underline underline-offset-2 hover:text-ink rounded-sm">
            What is real and what is mocked
          </Link>
        </div>
      </footer>
    </div>
  );
}

/** Sticky bottom action bar used on every journey screen. One primary action per screen. */
export function ActionBar({ children, width = "focus" }: { children: React.ReactNode; width?: ShellWidth }) {
  return (
    <aside aria-label="Page actions" className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className={`mx-auto ${WIDTH[width]} px-page py-3 flex gap-3`}>{children}</div>
    </aside>
  );
}

export function PrimaryButton({ children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`pressable min-h-[48px] flex-1 rounded-md bg-violet px-4 font-display font-semibold text-lg text-white tracking-wide hover:bg-[#3d2169] disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      className={`pressable min-h-[48px] rounded-md border border-ink/30 bg-card px-4 font-display font-semibold text-lg text-ink hover:bg-paper hover:border-ink/50 disabled:opacity-45 ${className}`}
    >
      {children}
    </button>
  );
}
