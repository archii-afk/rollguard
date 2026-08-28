import { createClaim, transition, type ClaimStore, type Ground } from "@/lib/claims";

/**
 * A judge who deep-links to /claims should still see the tracker working, and a judge
 * who files only Ameena should still be able to walk Imran's rejection → appeal path.
 * Seeds a submitted demo claim for each scripted member that has no claim yet.
 * Returns true if anything was seeded.
 */
const DEMO: { memberId: string; memberName: string; ground: Ground }[] = [
  { memberId: "ameena", memberName: "Ameena Begum", ground: "ALIVE_RESIDENT" },
  { memberId: "imran", memberName: "Imran Rafeeq", ground: "NEVER_SHIFTED" },
];

/** Demo claims are always "filed" inside the claims window, so seeding never trips the SUBMIT deadline check. */
const DEMO_FILED_AT = new Date("2026-08-26T10:00:00+05:30");

export function seedDemoClaims(store: ClaimStore, now = new Date()): boolean {
  const existing = new Set(store.list().map((c) => c.memberId));
  const submittedAt = new Date(Math.min(now.getTime() - 2 * 86_400_000, DEMO_FILED_AT.getTime()));
  let seeded = false;
  for (const d of DEMO) {
    if (existing.has(d.memberId)) continue;
    const claim = transition(createClaim({ ...d, form: "6" }, submittedAt), { type: "SUBMIT" }, submittedAt);
    store.save(claim);
    seeded = true;
  }
  return seeded;
}
