import { describe, it, expect } from "vitest";
import type OpenAI from "openai";
import { rankMatches } from "@/lib/match";
import { loadPreviousRoll, loadDraftRoll, loadHouseholds } from "@/lib/rolls/load";
import { classifyMember } from "@/lib/diff";

const prev = loadPreviousRoll(); const draft = loadDraftRoll();
const member = loadHouseholds().find(h => h.houseNo === "14")!.members.find(m => m.id === "rafeeq")!;
const a = classifyMember(member, prev, draft);

function parsingClient(output: unknown): OpenAI {
  return { responses: { parse: async () => ({ output_parsed: output }) } } as unknown as OpenAI;
}

function failingClient(): OpenAI {
  return { responses: { parse: async () => { throw new Error("rate limit"); } } } as unknown as OpenAI;
}

describe("rankMatches", () => {
  it("falls back deterministically when no client", async () => {
    const r = await rankMatches(member, a.previous!, a.candidates, { client: null });
    expect(r.source).toBe("fallback"); expect(r.rankings[0].candidateSerial).toBe(a.candidates[0].entry.serial);
    expect(r.rankings[0].sameProbability).toBeGreaterThan(0.5); expect(r.rankings[0].reasons).toContain("same-house");
  });
  it("uses the client's parsed output when available", async () => {
    const fake = parsingClient({ rankings: [{ candidateSerial: a.candidates[0].entry.serial, sameProbability: 0.93, reasons: ["Md. is a standard abbreviation of Mohammed", "Rafik/Rafeeq are transliteration variants"] }] });
    const r = await rankMatches(member, a.previous!, a.candidates, { client: fake });
    expect(r.source).toBe("openai"); expect(r.rankings[0].sameProbability).toBe(0.93);
  });
  it("falls back when the client throws", async () => {
    const boom = failingClient();
    const r = await rankMatches(member, a.previous!, a.candidates, { client: boom });
    expect(r.source).toBe("fallback");
  });
});
