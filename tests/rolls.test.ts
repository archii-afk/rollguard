import { describe, it, expect } from "vitest";
import { loadPreviousRoll, loadDraftRoll, loadHouseholds } from "@/lib/rolls/load";

describe("synthetic rolls", () => {
  it("loads both vintages for part 112", () => {
    const prev = loadPreviousRoll(); const draft = loadDraftRoll();
    expect(prev.partNo).toBe(112); expect(draft.partNo).toBe(112);
    expect(prev.entries.length).toBeGreaterThan(100);
    expect(prev.entries.every(e => e.epic.startsWith("ZZK"))).toBe(true);
  });
  it("contains the Rafeeq demo household with planted cases", () => {
    const prev = loadPreviousRoll(); const draft = loadDraftRoll();
    const hh = loadHouseholds().find(h => h.houseNo === "14")!;
    expect(hh.members.map(m => m.id)).toEqual(["rafeeq","ameena","salma","imran","farhan","zoya"]);
    expect(prev.entries.find(e => e.epic === "ZZK1400001")?.name.en).toBe("Mohammed Rafeeq");
    // Rafeeq re-enumerated under a different EPIC with a duplicate flag
    expect(draft.entries.find(e => e.epic === "ZZK1400001")).toBeUndefined();
    expect(draft.entries.find(e => e.name.en === "Md. Rafik")?.flag).toBe("DU");
    expect(draft.entries.find(e => e.epic === "ZZK1400002")?.flag).toBe("D");   // Ameena
    expect(draft.entries.find(e => e.epic === "ZZK1400003")?.flag).toBeUndefined(); // Salma retained
    expect(draft.entries.find(e => e.epic === "ZZK1400004")?.flag).toBe("S");   // Imran
    expect(draft.entries.find(e => e.epic === "ZZK1400005")?.flag).toBe("S");   // Farhan
    expect(hh.members.find(m => m.id === "farhan")?.expectedOutcome).toBe("correct-deletion");
    expect(hh.members.find(m => m.id === "zoya")?.epic).toBeUndefined();
  });
  it("draft flags are only A/S/D/DU", () => {
    const ok = new Set(["A","S","D","DU",undefined]);
    expect(loadDraftRoll().entries.every(e => ok.has(e.flag))).toBe(true);
  });
});
