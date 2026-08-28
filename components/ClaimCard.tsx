import { useState } from "react";
import { Timeline } from "@/components/Timeline";
import { NotificationFeed } from "@/components/NotificationFeed";
import { LangTabs, tabIdForLanguage, type Lang } from "@/components/LangTabs";
import { Countdown } from "@/components/Countdown";
import { ClaimNow } from "@/components/ClaimNow";
import { MockBadge } from "@/components/MockBadge";
import { DEADLINES, nextDemoEvent, type Claim, type ClaimEvent } from "@/lib/claims";

const GROUND_LABEL: Record<Claim["ground"], string> = {
  ALIVE_RESIDENT: "alive and resident here",
  NEVER_SHIFTED: "never shifted",
  RESIDENT_WAS_AWAY: "resident, was away",
  NOT_DUPLICATE: "not a duplicate",
  TURNED_18: "turned 18",
  CORRECT_DETAILS: "correct the details",
};

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function ClaimCard({
  claim,
  isNew,
  onEvent,
  error,
}: {
  claim: Claim;
  isNew?: boolean;
  onEvent: (claimId: string, e: ClaimEvent) => void;
  error?: string | null;
}) {
  const [lang, setLang] = useState<Lang>("en");
  const next = nextDemoEvent(claim);
  const done = claim.state === "RESTORED" || claim.state === "APPEAL_REJECTED";
  const tone = claim.state === "RESTORED" ? "border-ledger bg-ledger-soft/40" : claim.state === "APPEAL_REJECTED" || claim.state === "REJECTED" ? "border-stamp/50" : "border-line";
  const messagesPanelId = `claim-${claim.id}-messages-panel`;

  return (
    <article className={`claim-record rounded-md border bg-card ${tone} ${isNew ? "ring-2 ring-violet/40" : ""}`}>
      <header className="px-4 pt-4 pb-3 border-b border-line">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="font-display font-semibold text-xl leading-tight">{claim.memberName}</h2>
            <p className="text-sm text-muted">
              Form {claim.form} · {GROUND_LABEL[claim.ground]}
            </p>
          </div>
          {claim.ackNo && (
            <div className="text-right">
              <div className="font-mono text-[10px] uppercase tracking-wider text-muted">Ack no. <MockBadge label="mock" /></div>
              <div className="font-mono text-sm">{claim.ackNo}</div>
            </div>
          )}
        </div>
        <div className="mt-3">
          {claim.state === "CLAIM_DRAFTED" && <Countdown until={DEADLINES.claimWindowEnd} />}
          {claim.state === "REJECTED" && claim.orderedAt && (
            <Countdown until={addDays(claim.orderedAt, DEADLINES.appealDays)} label="to appeal to the DEO" />
          )}
          {claim.state === "RESTORED" && (
            <p className="text-sm font-medium text-ledger">Name restored. Check the final roll when it is published.</p>
          )}
          {claim.state === "APPEAL_REJECTED" && (
            <p className="text-sm font-medium text-stamp">Appeal rejected. The next step is a writ petition — outside this tool.</p>
          )}
        </div>
      </header>

      <ClaimNow claim={claim} />

      <div className="claim-detail-grid">
        <section aria-labelledby={`timeline-${claim.id}`}>
          <h3 id={`timeline-${claim.id}`} className="text-[11px] font-mono uppercase tracking-wider text-muted mb-3">Where the claim is</h3>
          <Timeline history={claim.history} current={claim.state} />
        </section>

        <section aria-labelledby={`messages-${claim.id}`}>
          <div className="flex flex-col gap-2 mb-2 sm:flex-row sm:items-center sm:justify-between">
            <h3 id={`messages-${claim.id}`} className="text-[11px] font-mono uppercase tracking-wider text-muted">Messages to your phone</h3>
            <LangTabs value={lang} panelId={messagesPanelId} label="Message language" onChange={setLang} />
          </div>
          <NotificationFeed items={claim.notifications} lang={lang} panelId={messagesPanelId} tabId={tabIdForLanguage(messagesPanelId, lang)} />
        </section>
      </div>

      <div className="px-4 pb-4 grid gap-4">
        {error && (
          <p role="alert" className="rounded-md border border-stamp/40 bg-stamp-soft px-3 py-2 text-sm">
            {error}
          </p>
        )}

        {!done && (
          <div className="flex flex-wrap gap-2">
            {claim.state === "REJECTED" && (
              <button
                type="button"
                onClick={() => onEvent(claim.id, { type: "FILE_APPEAL" })}
                className="pressable min-h-[48px] flex-1 rounded-md bg-violet px-4 font-display font-semibold text-lg text-white hover:bg-[#3d2169]"
              >
                File appeal to the DEO
              </button>
            )}
            {next && (
              <button
                type="button"
                onClick={() => onEvent(claim.id, next)}
                className="pressable min-h-[48px] rounded-md border border-dashed border-muted/70 bg-paper px-4 text-sm font-medium text-ink hover:bg-violet-soft"
              >
                <MockBadge label="demo" /> <span className="ml-1">Simulate next step: {describe(next)}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function describe(e: ClaimEvent) {
  switch (e.type) {
    case "BLO_SCHEDULED": return `BLO visits on ${new Date(e.visitDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    case "HEARING_NOTICED": return `ERO hearing on ${new Date(e.hearingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`;
    case "ORDER_ISSUED": return e.outcome === "RESTORED" ? "ERO orders restoration" : "ERO rejects the claim";
    case "FILE_APPEAL": return "file the appeal";
    case "APPEAL_DECIDED": return e.outcome === "RESTORED" ? "DEO allows the appeal" : "DEO rejects the appeal";
    default: return e.type;
  }
}
