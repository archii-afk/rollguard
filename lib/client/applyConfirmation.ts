import type { MemberAssessment, MemberStatus } from "@/lib/diff";
import type { DraftEntry } from "@/lib/rolls/types";

/**
 * Client-side mirror of lib/diff resolveAmbiguous: once the citizen confirms
 * "yes, that draft row is me", the row's flag decides the status. "none" means
 * the citizen rejected every candidate, so the name is simply missing.
 */
export function applyConfirmation(a: MemberAssessment, choice: number | "none" | undefined): MemberAssessment {
  if (a.status !== "AMBIGUOUS_MATCH" || choice === undefined) return a;
  if (choice === "none") {
    return { ...a, status: "NOT_FOUND", draft: undefined, suggestedForm: "6", reason: "You said none of the similar entries is this person, so the name is missing from the draft roll." };
  }
  const c = a.candidates.find((c) => c.entry.serial === choice);
  if (!c) return a;
  const status = statusForDraft(c.entry, a);
  const form: "6" | "8" = status === "DUPLICATE_FLAGGED" || status === "DETAILS_CHANGED" ? "8" : "6";
  return {
    ...a,
    status,
    draft: c.entry,
    suggestedForm: form,
    provenance: [
      ...a.provenance.filter((p) => !p.vintage.includes("draft")),
      { vintage: "2026-08-draft", partNo: c.entry.partNo, serial: c.entry.serial, field: "row", draft: c.entry.name.en, note: "confirmed by you as the same person" },
      ...(c.entry.flag ? [{ vintage: "2026-08-draft", partNo: c.entry.partNo, serial: c.entry.serial, field: "flag", draft: c.entry.flag, note: c.entry.sourceNote }] : []),
    ],
    reason: reasonFor(status),
  };
}

function statusForDraft(d: DraftEntry, a: MemberAssessment): MemberStatus {
  switch (d.flag) {
    case "D": return "MARKED_DEAD";
    case "S": return "MARKED_SHIFTED";
    case "A": return "MARKED_ABSENT";
    case "DU": return "DUPLICATE_FLAGGED";
    default: return a.previous && a.previous.name.en !== d.name.en ? "DETAILS_CHANGED" : "RETAINED";
  }
}

function reasonFor(s: MemberStatus): string {
  switch (s) {
    case "DUPLICATE_FLAGGED": return "The draft roll re-entered this person under a different spelling and flagged the pair as duplicates.";
    case "DETAILS_CHANGED": return "This person is on the draft roll, but the entry's details differ from the previous roll.";
    case "MARKED_DEAD": return "The draft roll marks this person as deceased.";
    case "MARKED_SHIFTED": return "The draft roll marks this person as shifted away.";
    case "MARKED_ABSENT": return "The draft roll marks this person as absent.";
    default: return "This person is on the draft roll.";
  }
}
