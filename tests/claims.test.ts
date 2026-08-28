import { describe, it, expect } from "vitest";
import { createClaim, transition, nextDemoEvent, InvalidTransition, DeadlineMissed, DEADLINES, MemoryClaimStore } from "@/lib/claims";
const T0 = new Date("2026-08-28T10:00:00+05:30");
const base = () => createClaim({ memberId: "ameena", memberName: "Ameena Begum", form: "6", ground: "ALIVE_RESIDENT" }, T0);

describe("createClaim", () => {
  it("starts in CLAIM_DRAFTED with one history entry and no ack", () => {
    const c = base(); expect(c.state).toBe("CLAIM_DRAFTED"); expect(c.history).toHaveLength(1); expect(c.ackNo).toBeUndefined();
  });
});
describe("transition — happy path to RESTORED", () => {
  it("SUBMIT issues an ack and a notification", () => {
    const c = transition(base(), { type: "SUBMIT" }, T0);
    expect(c.state).toBe("CLAIM_SUBMITTED"); expect(c.ackNo).toMatch(/^SIR-153-112-\d{6}$/);
    expect(c.notifications.at(-1)?.text.kn.length).toBeGreaterThan(5);
  });
  it("walks BLO → hearing → order → RESTORED, recording ERO_SPEAKING_ORDER in history", () => {
    let c = transition(base(), { type: "SUBMIT" }, T0);
    c = transition(c, { type: "BLO_SCHEDULED", visitDate: "2026-09-02" }, T0);
    c = transition(c, { type: "HEARING_NOTICED", hearingDate: "2026-09-09" }, T0);
    c = transition(c, { type: "ORDER_ISSUED", outcome: "RESTORED", reason: "Elector present at hearing with Aadhaar and ration card" }, T0);
    expect(c.state).toBe("RESTORED");
    expect(c.history.map(h => h.state)).toEqual(["CLAIM_DRAFTED","CLAIM_SUBMITTED","BLO_FIELD_VERIFICATION","ERO_HEARING_NOTICE","ERO_SPEAKING_ORDER","RESTORED"]);
    expect(c.orderedAt).toBeDefined();
  });
});
describe("transition — rejection and appeal", () => {
  const rejected = () => { let c = transition(base(), { type: "SUBMIT" }, T0);
    c = transition(c, { type: "BLO_SCHEDULED", visitDate: "2026-09-02" }, T0);
    c = transition(c, { type: "HEARING_NOTICED", hearingDate: "2026-09-09" }, T0);
    return transition(c, { type: "ORDER_ISSUED", outcome: "REJECTED", reason: "House locked on BLO visit" }, new Date("2026-09-10T10:00:00+05:30")); };
  it("REJECTED → FILE_APPEAL within appealDays → APPEAL_FILED → RESTORED", () => {
    let c = transition(rejected(), { type: "FILE_APPEAL" }, new Date("2026-09-20T10:00:00+05:30"));
    expect(c.state).toBe("APPEAL_FILED");
    c = transition(c, { type: "APPEAL_DECIDED", outcome: "RESTORED", reason: "DEO: ERO did not serve notice" }, new Date("2026-09-25"));
    expect(c.state).toBe("RESTORED");
  });
  it("FILE_APPEAL after appealDays throws DeadlineMissed", () => {
    const late = new Date(new Date("2026-09-10").getTime() + (DEADLINES.appealDays + 1) * 86400000);
    expect(() => transition(rejected(), { type: "FILE_APPEAL" }, late)).toThrow(DeadlineMissed);
  });
  it("APPEAL_DECIDED REJECTED is terminal", () => {
    let c = transition(rejected(), { type: "FILE_APPEAL" }, new Date("2026-09-12"));
    c = transition(c, { type: "APPEAL_DECIDED", outcome: "REJECTED", reason: "x" }, new Date("2026-09-25"));
    expect(c.state).toBe("APPEAL_REJECTED");
    expect(() => transition(c, { type: "FILE_APPEAL" }, new Date("2026-09-26"))).toThrow(InvalidTransition);
  });
});
describe("deadlines and illegal moves", () => {
  it("SUBMIT after claimWindowEnd throws DeadlineMissed", () => {
    expect(() => transition(base(), { type: "SUBMIT" }, new Date("2026-09-24T00:00:00+05:30"))).toThrow(DeadlineMissed);
  });
  it("every illegal event throws InvalidTransition", () => {
    expect(() => transition(base(), { type: "FILE_APPEAL" }, T0)).toThrow(InvalidTransition);
    expect(() => transition(base(), { type: "ORDER_ISSUED", outcome: "RESTORED", reason: "" }, T0)).toThrow(InvalidTransition);
  });
  it("transition is pure", () => { const c = base(); transition(c, { type: "SUBMIT" }, T0); expect(c.state).toBe("CLAIM_DRAFTED"); });
});
describe("nextDemoEvent", () => {
  it("scripts Imran through rejection and appeal, Ameena straight to RESTORED", () => {
    let a = transition(base(), { type: "SUBMIT" }, T0); const seenA: string[] = [];
    for (let e = nextDemoEvent(a); e; e = nextDemoEvent(a)) { seenA.push(e.type); a = transition(a, e, new Date()); }
    expect(a.state).toBe("RESTORED"); expect(seenA).toEqual(["BLO_SCHEDULED","HEARING_NOTICED","ORDER_ISSUED"]);
    let i = transition(createClaim({ memberId: "imran", memberName: "Imran Rafeeq", form: "6", ground: "NEVER_SHIFTED" }, T0), { type: "SUBMIT" }, T0);
    const seenI: string[] = [];
    for (let e = nextDemoEvent(i); e; e = nextDemoEvent(i)) { seenI.push(e.type); i = transition(i, e, new Date()); }
    expect(seenI).toEqual(["BLO_SCHEDULED","HEARING_NOTICED","ORDER_ISSUED","FILE_APPEAL","APPEAL_DECIDED"]); expect(i.state).toBe("RESTORED");
  });
  it("returns null in CLAIM_DRAFTED and terminal states", () => { expect(nextDemoEvent(base())).toBeNull(); });
});
describe("MemoryClaimStore", () => {
  it("saves, lists, gets, clears", () => { const s = new MemoryClaimStore(); const c = base(); s.save(c); expect(s.list()).toHaveLength(1); expect(s.get(c.id)?.memberId).toBe("ameena"); s.clear(); expect(s.list()).toHaveLength(0); });
});
