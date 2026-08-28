import { describe, it, expect } from "vitest";
import { rankMatches } from "@/lib/match";
import { loadPreviousRoll, loadDraftRoll, loadHouseholds } from "@/lib/rolls/load";
import { classifyMember } from "@/lib/diff";

const prev = loadPreviousRoll(); const draft = loadDraftRoll();
const member = loadHouseholds().find(h => h.houseNo === "14")!.members.find(m => m.id === "rafeeq")!;
const a = classifyMember(member, prev, draft);

describe("rankMatches", () => {
  it("falls back deterministically when no client", async () => {
    const r = await rankMatches(member, a.previous!, a.candidates, { client: null });
    expect(r.source).toBe("fallback"); expect(r.rankings[0].candidateSerial).toBe(a.candidates[0].entry.serial);
    expect(r.rankings[0].sameProbability).toBeGreaterThan(0.5); expect(r.rankings[0].reasons).toContain("same-house");
  });
  it("uses the client's parsed output when available", async () => {
    const fake = { responses: { parse: async () => ({ output_parsed: { rankings: [{ candidateSerial: a.candidates[0].entry.serial, sameProbability: 0.93, reasons: ["Md. is a standard abbreviation of Mohammed", "Rafik/Rafeeq are transliteration variants"] }] } }) } } as any;
    const r = await rankMatches(member, a.previous!, a.candidates, { client: fake });
    expect(r.source).toBe("openai"); expect(r.rankings[0].sameProbability).toBe(0.93);
  });
  it("falls back when the client throws", async () => {
    const boom = { responses: { parse: async () => { throw new Error("rate limit"); } } } as any;
    const r = await rankMatches(member, a.previous!, a.candidates, { client: boom });
    expect(r.source).toBe("fallback");
  });
});
