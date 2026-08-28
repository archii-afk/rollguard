import { DEADLINES } from "./config";
import { notificationFor } from "./notifications";
import type { Claim, ClaimEvent, ClaimState, Ground, HistoryEntry } from "./types";

const LEGAL: Record<ClaimState, ClaimEvent["type"][]> = {
  DRAFT_PUBLISHED: ["DRAFT_COMPLETED"],
  CLAIM_DRAFTED: ["SUBMIT"],
  CLAIM_SUBMITTED: ["BLO_SCHEDULED"],
  BLO_FIELD_VERIFICATION: ["HEARING_NOTICED"],
  ERO_HEARING_NOTICE: ["ORDER_ISSUED"],
  ERO_SPEAKING_ORDER: [],
  RESTORED: [],
  REJECTED: ["FILE_APPEAL"],
  APPEAL_FILED: ["APPEAL_DECIDED"],
  APPEAL_REJECTED: [],
};

export class InvalidTransition extends Error {
  constructor(from: ClaimState, event: string) {
    super(`Cannot apply ${event} from ${from}`);
    this.name = "InvalidTransition";
  }
}

export class DeadlineMissed extends Error {
  constructor(what: string, deadline: string) {
    super(`${what} deadline missed: ${deadline}`);
    this.name = "DeadlineMissed";
  }
}

function hash(value: string): number {
  let result = 0;
  for (const character of value) result = (Math.imul(result, 31) + character.charCodeAt(0)) >>> 0;
  return result % 1_000_000;
}

function entry(state: ClaimState, now: Date, note?: string): HistoryEntry {
  return { state, at: now.toISOString(), ...(note ? { note } : {}) };
}

export function createClaim(
  input: { memberId: string; memberName: string; form: "6" | "8"; ground: Ground },
  now: Date,
): Claim {
  return {
    ...input,
    id: `${input.memberId}-${now.getTime()}`,
    state: "CLAIM_DRAFTED",
    history: [entry("CLAIM_DRAFTED", now)],
    notifications: [],
  };
}

export function transition(claim: Claim, event: ClaimEvent, now: Date): Claim {
  if (!LEGAL[claim.state].includes(event.type)) throw new InvalidTransition(claim.state, event.type);

  const at = now.toISOString();
  let next: Claim;

  switch (event.type) {
    case "DRAFT_COMPLETED":
      next = { ...claim, state: "CLAIM_DRAFTED", history: [...claim.history, entry("CLAIM_DRAFTED", now)] };
      break;
    case "SUBMIT": {
      const deadline = new Date(`${DEADLINES.claimWindowEnd}T23:59:59.999+05:30`);
      if (now > deadline) throw new DeadlineMissed("claim", DEADLINES.claimWindowEnd);
      const ackNo = `SIR-153-112-${String(hash(claim.id)).padStart(6, "0")}`;
      next = {
        ...claim,
        state: "CLAIM_SUBMITTED",
        ackNo,
        submittedAt: at,
        history: [...claim.history, entry("CLAIM_SUBMITTED", now)],
      };
      break;
    }
    case "BLO_SCHEDULED":
      next = {
        ...claim,
        state: "BLO_FIELD_VERIFICATION",
        history: [...claim.history, entry("BLO_FIELD_VERIFICATION", now, `Visit scheduled: ${event.visitDate}`)],
      };
      break;
    case "HEARING_NOTICED":
      next = {
        ...claim,
        state: "ERO_HEARING_NOTICE",
        history: [...claim.history, entry("ERO_HEARING_NOTICE", now, `Hearing scheduled: ${event.hearingDate}`)],
      };
      break;
    case "ORDER_ISSUED":
      next = {
        ...claim,
        state: event.outcome,
        orderedAt: at,
        history: [
          ...claim.history,
          entry("ERO_SPEAKING_ORDER", now, event.reason),
          entry(event.outcome, now),
        ],
      };
      break;
    case "FILE_APPEAL": {
      const deadline = new Date(new Date(claim.orderedAt!).getTime() + DEADLINES.appealDays * 86_400_000);
      if (now > deadline) throw new DeadlineMissed("appeal", deadline.toISOString());
      next = { ...claim, state: "APPEAL_FILED", history: [...claim.history, entry("APPEAL_FILED", now)] };
      break;
    }
    case "APPEAL_DECIDED": {
      const state = event.outcome === "RESTORED" ? "RESTORED" : "APPEAL_REJECTED";
      next = { ...claim, state, history: [...claim.history, entry(state, now, event.reason)] };
      break;
    }
  }

  return { ...next, notifications: [...claim.notifications, notificationFor(next.state, next, now)] };
}
