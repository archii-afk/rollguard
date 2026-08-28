import { describe, it, expect } from "vitest";
import { MemoryClaimStore, createClaim } from "@/lib/claims";
import { seedDemoClaims } from "@/lib/client/seedDemoClaims";

describe("seedDemoClaims", () => {
  it("seeds both demo claims into an empty store", () => {
    const s = new MemoryClaimStore();
    expect(seedDemoClaims(s)).toBe(true);
    expect(s.list().map((c) => c.memberId).sort()).toEqual(["ameena", "imran"]);
    expect(s.list().every((c) => c.state === "CLAIM_SUBMITTED")).toBe(true);
  });
  it("only seeds members without a claim", () => {
    const s = new MemoryClaimStore();
    s.save(createClaim({ memberId: "ameena", memberName: "Ameena Begum", form: "6", ground: "ALIVE_RESIDENT" }, new Date()));
    expect(seedDemoClaims(s)).toBe(true);
    expect(s.list().filter((c) => c.memberId === "ameena")).toHaveLength(1);
    expect(s.list().some((c) => c.memberId === "imran")).toBe(true);
  });
  it("does not throw when opened long after the claims window closes", () => {
    const s = new MemoryClaimStore();
    expect(() => seedDemoClaims(s, new Date("2026-12-01T10:00:00+05:30"))).not.toThrow();
    expect(s.list()).toHaveLength(2);
  });
});
