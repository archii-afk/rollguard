import { createClaim, transition, type ClaimStore } from "@/lib/claims";

/**
 * A judge who deep-links to /claims should still see the tracker working.
 * Seeds two submitted claims for the demo household the first time the store is empty.
 */
export function seedDemoClaims(store: ClaimStore, now = new Date()): boolean {
  if (store.list().length > 0) return false;
  const submittedAt = new Date(now.getTime() - 2 * 86_400_000); // filed two days ago
  const ameena = transition(
    createClaim({ memberId: "ameena", memberName: "Ameena Begum", form: "6", ground: "ALIVE_RESIDENT" }, submittedAt),
    { type: "SUBMIT" },
    submittedAt,
  );
  const imran = transition(
    createClaim({ memberId: "imran", memberName: "Imran Rafeeq", form: "6", ground: "NEVER_SHIFTED" }, submittedAt),
    { type: "SUBMIT" },
    submittedAt,
  );
  store.save(ameena);
  store.save(imran);
  return true;
}
