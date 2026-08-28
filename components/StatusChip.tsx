import type { MemberStatus } from "@/lib/diff";
import { Icon } from "@/components/Icon";

/** Copy and colour for every status. Stamps are for things the draft roll *did*; pills for everything else. */
export const STATUS_META: Record<
  MemberStatus,
  { label: string; short: string; tone: "ledger" | "stamp" | "amber" | "violet" | "muted"; stamp: boolean }
> = {
  RETAINED: { label: "On the draft roll", short: "Retained", tone: "ledger", stamp: false },
  DETAILS_CHANGED: { label: "Details changed", short: "Changed", tone: "amber", stamp: false },
  MARKED_DEAD: { label: "Marked deceased", short: "D", tone: "stamp", stamp: true },
  MARKED_SHIFTED: { label: "Marked shifted", short: "S", tone: "stamp", stamp: true },
  MARKED_ABSENT: { label: "Marked absent", short: "A", tone: "stamp", stamp: true },
  DUPLICATE_FLAGGED: { label: "Flagged duplicate", short: "DU", tone: "amber", stamp: true },
  NOT_FOUND: { label: "Missing from draft", short: "Missing", tone: "stamp", stamp: false },
  NEW_ELIGIBLE: { label: "Turned 18 — not enrolled", short: "New voter", tone: "violet", stamp: false },
  AMBIGUOUS_MATCH: { label: "Needs your confirmation", short: "Confirm", tone: "violet", stamp: false },
};

const TONE = {
  ledger: "bg-ledger-soft text-ledger border-ledger/40",
  stamp: "bg-stamp-soft text-stamp border-stamp/50",
  amber: "bg-amber-soft text-amber border-amber/50",
  violet: "bg-violet-soft text-violet border-violet/40",
  muted: "bg-paper text-muted border-line",
};

/* A compact label stays on one line and shrinks its container, never wraps to a second line. */
const CHIP = "status-chip inline-flex max-w-full min-w-0 items-center gap-1 whitespace-nowrap rounded-sm border px-2 py-0.5 text-xs font-medium leading-5";

export function StatusChip({ status, looksCorrect = false }: { status: MemberStatus; looksCorrect?: boolean }) {
  const m = STATUS_META[status];
  if (looksCorrect) {
    return (
      <span className={`${CHIP} ${TONE.muted}`}>
        <Icon name="check" size={14} />
        <span className="truncate">{m.label} · looks correct</span>
      </span>
    );
  }
  return (
    <span className={`${CHIP} ${TONE[m.tone]}`}>
      <span className="truncate">{m.label}</span>
    </span>
  );
}

/** The rubber stamp: what the draft roll physically did to this entry. */
export function Stamp({ status, animate = true }: { status: MemberStatus; animate?: boolean }) {
  const m = STATUS_META[status];
  if (!m.stamp) return null;
  const tone = m.tone === "amber" ? "border-amber text-amber" : "border-stamp text-stamp";
  return (
    <span
      aria-hidden
      className={`stamp pointer-events-none select-none whitespace-nowrap font-display font-bold uppercase tracking-[0.18em] text-[13px] leading-none border-[3px] rounded-[3px] px-2 py-1 opacity-85 mix-blend-multiply ${tone} ${animate ? "animate-stamp" : "-rotate-6"}`}
      style={{ maskImage: "radial-gradient(circle at 30% 40%, black 60%, transparent 100%)", WebkitMaskImage: "radial-gradient(circle at 30% 40%, black 60%, transparent 100%)" }}
    >
      {m.label} · {m.short}
    </span>
  );
}
