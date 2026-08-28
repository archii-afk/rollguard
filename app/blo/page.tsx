"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";
import { MockBadge } from "@/components/MockBadge";
import { QueueSummary } from "@/components/QueueSummary";
import { STATE_LABELS } from "@/components/Timeline";
import { ListSkeleton } from "@/components/Skeleton";
import { DEADLINES, type Claim, type ClaimEvent, type ClaimState } from "@/lib/claims";
import { getClaimsApi, ClaimsApiError, type ClaimsApi } from "@/lib/client/remoteClaims";

/**
 * The officer's side of the same state machine. A BLO sees claims for their part as a
 * work queue and moves them with the same transition() the citizen's tracker uses —
 * on the server when a database is configured, so both views read one source of truth.
 */
const QUEUE: ClaimState[] = ["CLAIM_SUBMITTED", "BLO_FIELD_VERIFICATION", "ERO_HEARING_NOTICE", "REJECTED", "APPEAL_FILED", "RESTORED", "APPEAL_REJECTED"];
const DEMO_EPIC = "ZZK1400001";

const GROUND_TEXT: Record<Claim["ground"], string> = {
  ALIVE_RESIDENT: "Claims to be alive and ordinarily resident",
  NEVER_SHIFTED: "Claims never to have shifted",
  RESIDENT_WAS_AWAY: "Claims temporary absence, not shifting",
  NOT_DUPLICATE: "Claims the duplicate flag is a spelling variant",
  TURNED_18: "New elector, turned 18",
  CORRECT_DETAILS: "Requests correction of entry details",
};

export default function BloQueue() {
  const [api, setApi] = useState<ClaimsApi | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    getClaimsApi(DEMO_EPIC)
      .then(async (a) => {
        const all = await a.listAll();
        if (!live) return;
        setApi(a);
        setClaims(all);
      })
      .catch(() => live && setMsg("Could not load the queue. Reload to try again."));
    return () => { live = false; };
  }, []);

  async function act(c: Claim, e: ClaimEvent) {
    if (!api) return;
    try {
      const next = await api.apply(c, e);
      setClaims((xs) => xs.map((x) => (x.id === c.id ? next : x)));
      setMsg(null);
    } catch (err) {
      if (err instanceof ClaimsApiError && err.code === "STATE_CONFLICT") {
        setMsg("That claim was updated elsewhere — queue refreshed.");
        setClaims(await api.listAll());
      } else {
        setMsg(err instanceof Error ? err.message : "Could not apply that action.");
      }
    }
  }

  const byState = QUEUE.map((s) => ({ state: s, items: claims.filter((c) => c.state === s) })).filter((g) => g.items.length);
  const dueSoon = claims.filter((c) => c.state === "CLAIM_SUBMITTED").length;

  return (
    <Shell width="wide">
      <PageHeader
        eyebrow="Officer view · BLO, Part 112 · AC 153 Shantinagar"
        title="Claims queue"
        description={`${claims.length} claim${claims.length === 1 ? "" : "s"} for this part · ${dueSoon} awaiting a field visit within ${DEADLINES.bloVisitDays} days`}
      >
        <MockBadge label="Mock role" />
      </PageHeader>

      <div className="queue-context">
        <p className="text-xs text-muted">
          <MockBadge label="mock role" /> There is no officer login here. Every action below runs the same state machine the citizen’s tracker uses
          {api?.persistence === "postgres" ? ", against the shared Postgres store" : ", in this browser"}.{" "}
          <Link href="/claims" className="underline underline-offset-2">Citizen view</Link>
        </p>
      </div>

      <QueueSummary total={claims.length} dueSoon={dueSoon} groups={byState.length} />

      {msg && (
        <p role="alert" className="mb-4 rounded-md border border-stamp/40 bg-stamp-soft px-3 py-2 text-sm">{msg}</p>
      )}

      {!api ? (
        <ListSkeleton count={2} label="Loading the queue" />
      ) : byState.length === 0 ? (
        <p className="rounded-md border border-line bg-card px-4 py-6 text-center text-sm text-muted">Queue is empty.</p>
      ) : (
        byState.map(({ state, items }) => (
          <section key={state} className="queue-group">
            <h2 className="queue-group-heading">
              <span>{STATE_LABELS[state].title}</span>
              <span className="queue-group-count nums">{items.length}</span>
            </h2>
            <ul className="queue-card-grid">
              {items.map((c) => (
                <li key={c.id} className="queue-card">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold">{c.memberName}</div>
                      <div className="text-xs text-muted font-mono">{c.ackNo ?? "no ack"} · Form {c.form}</div>
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted">{STATE_LABELS[c.state].who}</span>
                  </div>
                  <p className="mt-2 text-sm">{GROUND_TEXT[c.ground]}</p>
                  {c.history.at(-1)?.note && <p className="mt-1 text-xs text-muted italic">“{c.history.at(-1)!.note}”</p>}
                  <div className="queue-card-actions">
                    {c.state === "CLAIM_SUBMITTED" && (
                      <Btn onClick={() => act(c, { type: "BLO_SCHEDULED", visitDate: "2026-09-02" })}>Schedule field visit</Btn>
                    )}
                    {c.state === "BLO_FIELD_VERIFICATION" && (
                      <Btn onClick={() => act(c, { type: "HEARING_NOTICED", hearingDate: "2026-09-09" })}>Report to ERO · issue hearing notice</Btn>
                    )}
                    {c.state === "ERO_HEARING_NOTICE" && (
                      <>
                        <Btn onClick={() => act(c, { type: "ORDER_ISSUED", outcome: "RESTORED", reason: "Elector appeared with identity and residence proof; deletion set aside" })}>
                          ERO: restore
                        </Btn>
                        <Btn tone="danger" onClick={() => act(c, { type: "ORDER_ISSUED", outcome: "REJECTED", reason: "Elector did not appear; BLO report stands" })}>
                          ERO: reject
                        </Btn>
                      </>
                    )}
                    {c.state === "APPEAL_FILED" && (
                      <>
                        <Btn onClick={() => act(c, { type: "APPEAL_DECIDED", outcome: "RESTORED", reason: "DEO: no notice served before deletion; ERO order set aside" })}>
                          DEO: allow appeal
                        </Btn>
                        <Btn tone="danger" onClick={() => act(c, { type: "APPEAL_DECIDED", outcome: "REJECTED", reason: "DEO: ERO order upheld" })}>
                          DEO: dismiss
                        </Btn>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </Shell>
  );
}

function Btn({ children, onClick, tone = "default" }: { children: React.ReactNode; onClick: () => void; tone?: "default" | "danger" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`pressable queue-action min-h-[44px] rounded-md border px-3 text-sm font-medium ${
        tone === "danger" ? "border-stamp/50 text-stamp bg-stamp-soft/50 hover:bg-stamp-soft" : "border-violet/40 text-violet bg-violet-soft/50 hover:bg-violet-soft"
      }`}
    >
      {children}
    </button>
  );
}
