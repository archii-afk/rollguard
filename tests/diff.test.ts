import { describe, it, expect } from "vitest";
import { normaliseName, jaroWinkler, classifyMember, resolveAmbiguous, resolveHousehold, explainStatus } from "@/lib/diff";
import { loadPreviousRoll, loadDraftRoll, loadHouseholds } from "@/lib/rolls/load";

describe("normaliseName", () => {
  it("expands honorific abbreviations and strips punctuation/diacritics", () => {
    expect(normaliseName("Md. Rafik")).toBe("mohammed rafik");
    expect(normaliseName("Mohd Rafeeq")).toBe("mohammed rafeeq");
    expect(normaliseName("Smt. Lakshmi  Devi")).toBe("lakshmi devi");
    expect(normaliseName("D'Souza, Joseph")).toBe("dsouza joseph");
  });
});

describe("jaroWinkler", () => {
  it("scores identical=1, unrelated low, near-transliterations high", () => {
    expect(jaroWinkler("abc", "abc")).toBe(1);
    expect(jaroWinkler("mohammed rafeeq", "mohammed rafik")).toBeGreaterThan(0.9);
    expect(jaroWinkler("mohammed rafeeq", "lakshmi devi")).toBeLessThan(0.6);
  });
});

describe("classifyMember on the demo household", () => {
  const prev = loadPreviousRoll(); const draft = loadDraftRoll();
  const hh = loadHouseholds().find(h => h.houseNo === "14")!;
  const by = (id: string) => classifyMember(hh.members.find(m => m.id === id)!, prev, draft);

  it("Ameena → MARKED_DEAD with provenance pointing at the draft flag", () => {
    const a = by("ameena");
    expect(a.status).toBe("MARKED_DEAD"); expect(a.suggestedForm).toBe("6");
    expect(a.provenance.some(p => p.field === "flag" && p.draft === "D" && p.vintage === "2026-08-draft")).toBe(true);
  });
  it("Salma → RETAINED", () => expect(by("salma").status).toBe("RETAINED"));
  it("Imran → MARKED_SHIFTED, not looksCorrect", () => { const a = by("imran"); expect(a.status).toBe("MARKED_SHIFTED"); expect(a.looksCorrect).toBe(false); });
  it("Farhan → MARKED_SHIFTED and looksCorrect", () => expect(by("farhan").looksCorrect).toBe(true));
  it("Zoya → NEW_ELIGIBLE (no EPIC, age ≥ 18)", () => { const a = by("zoya"); expect(a.status).toBe("NEW_ELIGIBLE"); expect(a.suggestedForm).toBe("6"); });
  it("Rafeeq → AMBIGUOUS_MATCH with 'Md. Rafik' as top candidate", () => {
    const a = by("rafeeq");
    expect(a.status).toBe("AMBIGUOUS_MATCH");
    expect(a.candidates[0].entry.name.en).toBe("Md. Rafik");
    expect(a.candidates[0].rules).toContain("same-house");
  });
  it("resolveAmbiguous(Rafeeq, Md. Rafik) → DUPLICATE_FLAGGED, Form 8", () => {
    const a = by("rafeeq"); const r = resolveAmbiguous(a, a.candidates[0].entry.serial, draft);
    expect(r.status).toBe("DUPLICATE_FLAGGED"); expect(r.suggestedForm).toBe("8"); expect(r.draft?.flag).toBe("DU");
  });
  it("NOT_FOUND when the row vanished and nothing similar exists", () => {
    const ghost = { id: "g", name: { en: "Zzyzx Qqq", kn: "" }, age: 40, gender: "M" as const, relationToHead: "x", epic: "ZZK9999999" };
    const prevWithGhost = { ...prev, entries: [...prev.entries, { serial: 9999, epic: "ZZK9999999", name: ghost.name, relationType: "F" as const, relationName: { en: "X", kn: "" }, houseNo: "99", age: 39, gender: "M" as const, partNo: 112 }] };
    expect(classifyMember(ghost, prevWithGhost, draft).status).toBe("NOT_FOUND");
  });
  it("DETAILS_CHANGED when age drifts by more than 2", () => {
    const e = prev.entries.find(x => x.epic === "ZZK1400003")!;
    const d2 = { ...draft, entries: draft.entries.map(x => x.epic === e.epic ? { ...x, age: e.age + 6 } : x) };
    expect(classifyMember(hh.members.find(m => m.id === "salma")!, prev, d2).status).toBe("DETAILS_CHANGED");
  });
});

describe("resolveHousehold", () => {
  it("returns the whole house for any member EPIC, minors excluded", () => {
    const r = resolveHousehold("ZZK1400003")!;
    expect(r.household.houseNo).toBe("14");
    expect(r.assessments.map(a => a.member.id)).toEqual(["rafeeq","ameena","salma","imran","farhan","zoya"]);
  });
  it("is null for an unknown EPIC", () => expect(resolveHousehold("ZZK0000000")).toBeNull());
});

describe("explainStatus", () => {
  it("has copy and grounds for every status", () => {
    for (const s of ["RETAINED","DETAILS_CHANGED","MARKED_DEAD","MARKED_SHIFTED","MARKED_ABSENT","DUPLICATE_FLAGGED","NOT_FOUND","NEW_ELIGIBLE","AMBIGUOUS_MATCH"] as const) {
      const e = explainStatus(s); expect(e.reason.length).toBeGreaterThan(10); expect(e.lawRequires.length).toBeGreaterThan(10);
    }
    expect(explainStatus("MARKED_DEAD").groundOptions).toContain("ALIVE_RESIDENT");
  });
});
