import type { ClaimState, HistoryEntry } from "@/lib/claims";

/** Every state a claim can pass through, in the order the process runs. Order carries meaning here. */
export const STATE_LABELS: Record<ClaimState, { title: string; who: string }> = {
  DRAFT_PUBLISHED: { title: "Draft roll published", who: "ERO" },
  CLAIM_DRAFTED: { title: "Claim drafted", who: "You" },
  CLAIM_SUBMITTED: { title: "Claim submitted", who: "You → ERO" },
  BLO_FIELD_VERIFICATION: { title: "BLO field verification", who: "Booth Level Officer" },
  ERO_HEARING_NOTICE: { title: "Hearing notice", who: "ERO" },
  ERO_SPEAKING_ORDER: { title: "Speaking order", who: "ERO" },
  RESTORED: { title: "Name restored", who: "ERO / DEO" },
  REJECTED: { title: "Claim rejected", who: "ERO" },
  APPEAL_FILED: { title: "Appeal filed", who: "You → DEO" },
  APPEAL_REJECTED: { title: "Appeal rejected", who: "DEO" },
};

const MAIN_TRACK: ClaimState[] = ["CLAIM_DRAFTED", "CLAIM_SUBMITTED", "BLO_FIELD_VERIFICATION", "ERO_HEARING_NOTICE", "ERO_SPEAKING_ORDER"];

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function Timeline({ history, current }: { history: HistoryEntry[]; current: ClaimState }) {
  const seen = new Map(history.map((h) => [h.state, h]));
  const outcome: ClaimState[] =
    current === "RESTORED" && !seen.has("REJECTED") ? ["RESTORED"]
    : seen.has("REJECTED") ? ["REJECTED", "APPEAL_FILED", current === "APPEAL_REJECTED" ? "APPEAL_REJECTED" : "RESTORED"]
    : ["RESTORED"];
  const track = [...MAIN_TRACK, ...outcome];

  return (
    <ol className="relative border-l-2 border-line ml-2 pl-5 space-y-4">
      {track.map((s) => {
        const h = seen.get(s);
        const isCurrent = s === current;
        const done = !!h;
        const bad = s === "REJECTED" || s === "APPEAL_REJECTED";
        const dot = done
          ? bad ? "bg-stamp border-stamp" : "bg-violet border-violet"
          : "bg-paper border-line";
        return (
          <li key={s} className="relative">
            <span aria-hidden className={`absolute -left-[27px] top-1 h-3.5 w-3.5 rounded-full border-2 ${dot} ${isCurrent ? "ring-4 ring-violet/20" : ""}`} />
            <div className={`text-[15px] leading-tight ${done ? "text-ink font-medium" : "text-muted"}`}>
              {STATE_LABELS[s].title}
              {isCurrent && <span className="ml-2 text-[10px] font-mono uppercase tracking-wider text-violet">now</span>}
            </div>
            <div className="text-xs text-muted font-mono">
              {STATE_LABELS[s].who}
              {h && <> · {fmt(h.at)}</>}
            </div>
            {h?.note && <p className="mt-1 text-sm text-ink/80 border-l-2 border-line pl-2 italic">“{h.note}”</p>}
          </li>
        );
      })}
    </ol>
  );
}
