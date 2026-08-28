import type { DraftEntry, HouseholdMember, Roll, RollEntry } from "@/lib/rolls/types";
import { explainStatus } from "./explain";
import { normaliseName } from "./normalise";
import { prefilter, type Candidate } from "./prefilter";

export type MemberStatus =
  | "RETAINED"
  | "DETAILS_CHANGED"
  | "MARKED_DEAD"
  | "MARKED_SHIFTED"
  | "MARKED_ABSENT"
  | "DUPLICATE_FLAGGED"
  | "NOT_FOUND"
  | "NEW_ELIGIBLE"
  | "AMBIGUOUS_MATCH";

export interface Provenance {
  vintage: string;
  partNo: number;
  serial: number;
  field: string;
  previous?: string;
  draft?: string;
  note?: string;
}

export interface MemberAssessment {
  member: HouseholdMember;
  status: MemberStatus;
  previous?: RollEntry;
  draft?: DraftEntry;
  candidates: Candidate[];
  provenance: Provenance[];
  suggestedForm?: "6" | "8";
  looksCorrect: boolean;
  reason: string;
}

function assessment(
  member: HouseholdMember,
  status: MemberStatus,
  details: Partial<Pick<MemberAssessment, "previous" | "draft" | "candidates" | "provenance" | "suggestedForm">> = {},
): MemberAssessment {
  return {
    member,
    status,
    candidates: details.candidates ?? [],
    provenance: details.provenance ?? [],
    previous: details.previous,
    draft: details.draft,
    suggestedForm: details.suggestedForm ?? explainStatus(status).suggestedForm,
    looksCorrect: member.expectedOutcome === "correct-deletion",
    reason: explainStatus(status).reason,
  };
}

function changedProvenance(prev: RollEntry, draft: DraftEntry, prevVintage: string, draftVintage: string): Provenance[] {
  const out: Provenance[] = [{ vintage: prevVintage, partNo: prev.partNo, serial: prev.serial, field: "row", previous: prev.name.en }];
  const add = (field: string, previous: string, next: string) => out.push({ vintage: draftVintage, partNo: draft.partNo, serial: draft.serial, field, previous, draft: next });
  if (normaliseName(prev.name.en) !== normaliseName(draft.name.en)) add("name", prev.name.en, draft.name.en);
  if (Math.abs(draft.age - (prev.age + 1)) > 2) add("age", String(prev.age), String(draft.age));
  if (prev.houseNo !== draft.houseNo) add("houseNo", prev.houseNo, draft.houseNo);
  if (prev.relationType !== draft.relationType) add("relationType", prev.relationType, draft.relationType);
  return out;
}

function classifyPair(
  member: HouseholdMember,
  prev: RollEntry,
  draft: DraftEntry,
  prevVintage: string,
  draftVintage: string,
): MemberAssessment {
  const flagStatuses = {
    D: "MARKED_DEAD",
    S: "MARKED_SHIFTED",
    A: "MARKED_ABSENT",
    DU: "DUPLICATE_FLAGGED",
  } as const;
  const provenance = changedProvenance(prev, draft, prevVintage, draftVintage);
  let status: MemberStatus;
  if (draft.flag) {
    status = flagStatuses[draft.flag];
    provenance.push({
      vintage: draftVintage,
      partNo: draft.partNo,
      serial: draft.serial,
      field: "flag",
      draft: draft.flag,
      note: draft.sourceNote,
    });
  } else {
    status = provenance.length > 1 ? "DETAILS_CHANGED" : "RETAINED";
  }
  return assessment(member, status, { previous: prev, draft, provenance });
}

export function classifyMember(member: HouseholdMember, prevRoll: Roll, draftRoll: Roll<DraftEntry>): MemberAssessment {
  if (!member.epic) {
    const status: MemberStatus = member.age >= 18 ? "NEW_ELIGIBLE" : "RETAINED";
    return assessment(member, status, {
      provenance: [{ vintage: draftRoll.vintage, partNo: draftRoll.partNo, serial: 0, field: "presence", note: "not enumerated in either roll" }],
      suggestedForm: "6",
    });
  }

  const prev = prevRoll.entries.find(entry => entry.epic === member.epic);
  if (!prev) {
    return assessment(member, "NEW_ELIGIBLE", {
      provenance: [{ vintage: draftRoll.vintage, partNo: draftRoll.partNo, serial: 0, field: "presence", note: "not enumerated in previous roll" }],
    });
  }

  const draft = draftRoll.entries.find(entry => entry.epic === member.epic);
  if (draft) return classifyPair(member, prev, draft, prevRoll.vintage, draftRoll.vintage);

  const candidates = prefilter(prev, draftRoll.entries);
  if (candidates.length) {
    return assessment(member, "AMBIGUOUS_MATCH", {
      previous: prev,
      candidates,
      provenance: [
        { vintage: prevRoll.vintage, partNo: prev.partNo, serial: prev.serial, field: "row", previous: prev.name.en },
        ...candidates.map(({ entry }) => ({ vintage: draftRoll.vintage, partNo: entry.partNo, serial: entry.serial, field: "candidate", draft: entry.name.en })),
      ],
    });
  }

  return assessment(member, "NOT_FOUND", {
    previous: prev,
    provenance: [{ vintage: prevRoll.vintage, partNo: prev.partNo, serial: prev.serial, field: "row", previous: prev.name.en }],
  });
}

export function resolveAmbiguous(a: MemberAssessment, candidateSerial: number, draftRoll: Roll<DraftEntry>): MemberAssessment {
  const entry = a.candidates.find(candidate => candidate.entry.serial === candidateSerial)?.entry;
  if (!entry || !a.previous) return a;
  return {
    ...classifyPair(a.member, a.previous, entry, "2025-01", draftRoll.vintage),
    candidates: a.candidates,
  };
}
