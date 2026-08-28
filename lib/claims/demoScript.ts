import type { Claim, ClaimEvent } from "./types";

const SCRIPTS: Record<string, ClaimEvent[]> = {
  imran: [
    { type: "BLO_SCHEDULED", visitDate: "2026-09-02" },
    { type: "HEARING_NOTICED", hearingDate: "2026-09-09" },
    { type: "ORDER_ISSUED", outcome: "REJECTED", reason: "BLO reported house locked on two visits; elector not produced" },
    { type: "FILE_APPEAL" },
    { type: "APPEAL_DECIDED", outcome: "RESTORED", reason: "DEO: no notice was served before deletion; ERO order set aside" },
  ],
};

const DEFAULT: ClaimEvent[] = [
  { type: "BLO_SCHEDULED", visitDate: "2026-09-02" },
  { type: "HEARING_NOTICED", hearingDate: "2026-09-09" },
  { type: "ORDER_ISSUED", outcome: "RESTORED", reason: "Elector appeared with identity and residence proof; deletion set aside" },
];

export function nextDemoEvent(claim: Claim): ClaimEvent | null {
  const script = SCRIPTS[claim.memberId] ?? DEFAULT;
  const done = claim.history.filter(
    (history) => history.state !== "CLAIM_DRAFTED" && history.state !== "CLAIM_SUBMITTED" && history.state !== "ERO_SPEAKING_ORDER",
  ).length;
  if (claim.state === "CLAIM_DRAFTED") return null;
  return script[done] ?? null;
}
