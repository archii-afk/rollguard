import { describe, it, expect } from "vitest";
import type OpenAI from "openai";
import { draftClaim, templateDraft } from "@/lib/draft";
import { resolveHousehold } from "@/lib/diff";
const { assessments } = resolveHousehold("ZZK1400001")!;
const ameena = assessments.find(a => a.member.id === "ameena")!;
const input = { assessment: ameena, ground: "ALIVE_RESIDENT" as const, evidence: ["Aadhaar (masked)", "Ration card"], acName: "Shantinagar", partNo: 112 };

function parsingClient(output: unknown): OpenAI {
  return { responses: { parse: async () => ({ output_parsed: output }) } } as unknown as OpenAI;
}

describe("templateDraft", () => {
  it("produces Form 6 with trilingual declaration citing the roll row", () => {
    const d = templateDraft(input);
    expect(d.form).toBe("6");
    expect(d.fields.find(f => f.key === "name")?.value).toBe("Ameena Begum");
    expect(d.fields.find(f => f.key === "epic")?.value).toBe("ZZK1400002");
    expect(d.declaration.en).toMatch(/alive/i); expect(d.declaration.kn.length).toBeGreaterThan(20); expect(d.declaration.hi.length).toBeGreaterThan(20);
    expect(d.declaration.en).toContain("2026-08-draft");
    expect(d.evidenceChecklist.length).toBeGreaterThanOrEqual(2);
  });
  it("uses Form 8 for DUPLICATE_FLAGGED / CORRECT_DETAILS", () => {
    const raf = assessments.find(a => a.member.id === "rafeeq")!;
    expect(templateDraft({ ...input, assessment: { ...raf, status: "DUPLICATE_FLAGGED" }, ground: "NOT_DUPLICATE" }).form).toBe("8");
  });
});
describe("draftClaim", () => {
  it("returns fallback without client", async () => { const r = await draftClaim(input, { client: null }); expect(r.source).toBe("fallback"); });
  it("validates and returns parsed model output", async () => {
    const parsed = templateDraft(input);
    const fake = parsingClient(parsed);
    const r = await draftClaim(input, { client: fake }); expect(r.source).toBe("openai"); expect(r.draft.form).toBe("6");
  });
  it("falls back if the model returns an invalid shape", async () => {
    const bad = parsingClient({ form: "9" });
    expect((await draftClaim(input, { client: bad })).source).toBe("fallback");
  });
});

describe("reconcile — model prose, deterministic facts", () => {
  it("overrides a wrong form number and ground, and fills dropped fields from the template", async () => {
    const { reconcile } = await import("@/lib/draft/draftClaim");
    const bad = {
      form: "8" as const,
      fields: [{ key: "name", label: "Name", value: "Ameena Begum" }, { key: "ground", label: "Ground", value: "NEVER_SHIFTED" }],
      declaration: { en: "x", kn: "y", hi: "z" },
      evidenceChecklist: [],
    };
    const fixed = reconcile(bad, input);
    expect(fixed.form).toBe("6");
    expect(fixed.fields.find((f) => f.key === "ground")?.value).toBe("ALIVE_RESIDENT");
    expect(fixed.fields.find((f) => f.key === "epic")?.value).toBe("ZZK1400002");
    expect(fixed.fields.find((f) => f.key === "houseNo")?.value).toBe("14");
    expect(fixed.declaration.en).toBe("x");
  });
  it("draftClaim applies reconcile to model output", async () => {
    const wrongForm = { ...templateDraft(input), form: "8" as const };
    const fake = parsingClient(wrongForm);
    const r = await draftClaim(input, { client: fake });
    expect(r.source).toBe("openai"); expect(r.draft.form).toBe("6");
  });
});
