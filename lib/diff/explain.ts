import type { Ground } from "@/lib/claims/types";
import type { MemberStatus } from "./classify";

interface StatusExplanation {
  reason: string;
  lawRequires: string;
  suggestedForm?: "6" | "8";
  groundOptions: Ground[];
}

const EXPLANATIONS: Record<MemberStatus, StatusExplanation> = {
  RETAINED: {
    reason: "This elector appears in both roll snapshots without a material change or draft flag.",
    lawRequires: "No corrective filing is indicated; check the displayed particulars before relying on this result.",
    groundOptions: [],
  },
  DETAILS_CHANGED: {
    reason: "One or more electoral-roll details changed materially between the previous and draft snapshots.",
    lawRequires: "The elector should review the changed particulars and may request correction through Form 8.",
    suggestedForm: "8",
    groundOptions: ["CORRECT_DETAILS"],
  },
  MARKED_DEAD: {
    reason: "The draft roll marks this person as deceased, based on a BLO field report. If they are alive and living here, this is a wrongful deletion.",
    lawRequires: "ECI's SIR instructions: no name may be deleted without written notice to the elector and a speaking order by the ERO after hearing. You may file a claim until 23 Sep 2026.",
    suggestedForm: "6",
    groundOptions: ["ALIVE_RESIDENT"],
  },
  MARKED_SHIFTED: {
    reason: "The draft roll marks this elector as shifted from the registered address.",
    lawRequires: "A resident who never shifted may challenge the proposed deletion by filing a claim with residence evidence.",
    suggestedForm: "6",
    groundOptions: ["NEVER_SHIFTED"],
  },
  MARKED_ABSENT: {
    reason: "The draft roll marks this elector absent after field verification at the address.",
    lawRequires: "Temporary absence alone does not establish loss of ordinary residence; the elector may submit a claim and supporting evidence.",
    suggestedForm: "6",
    groundOptions: ["RESIDENT_WAS_AWAY"],
  },
  DUPLICATE_FLAGGED: {
    reason: "The draft roll flags this entry as a possible duplicate of another electoral-roll entry.",
    lawRequires: "The elector should identify the valid entry and request correction of the duplicate finding through Form 8.",
    suggestedForm: "8",
    groundOptions: ["NOT_DUPLICATE"],
  },
  NOT_FOUND: {
    reason: "The previous-roll entry is missing from the draft and no sufficiently similar replacement was found.",
    lawRequires: "An eligible resident omitted from the draft may file Form 6 during the claims window with identity and residence evidence.",
    suggestedForm: "6",
    groundOptions: ["ALIVE_RESIDENT"],
  },
  NEW_ELIGIBLE: {
    reason: "This household member is at least eighteen and has no linked entry in the previous roll.",
    lawRequires: "A newly eligible resident may apply for inclusion using Form 6 with age and residence evidence.",
    suggestedForm: "6",
    groundOptions: ["TURNED_18"],
  },
  AMBIGUOUS_MATCH: {
    reason: "The original EPIC is absent, but one or more similar draft entries may represent the same elector.",
    lawRequires: "The possible match must be reviewed before choosing the appropriate inclusion or correction filing.",
    groundOptions: [],
  },
};

export function explainStatus(status: MemberStatus): StatusExplanation {
  return EXPLANATIONS[status];
}

export type { Ground };
