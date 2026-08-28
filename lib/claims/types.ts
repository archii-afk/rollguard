export type ClaimState =
  | "DRAFT_PUBLISHED"
  | "CLAIM_DRAFTED"
  | "CLAIM_SUBMITTED"
  | "BLO_FIELD_VERIFICATION"
  | "ERO_HEARING_NOTICE"
  | "ERO_SPEAKING_ORDER"
  | "RESTORED"
  | "REJECTED"
  | "APPEAL_FILED"
  | "APPEAL_REJECTED";

export type Ground =
  | "ALIVE_RESIDENT"
  | "NEVER_SHIFTED"
  | "RESIDENT_WAS_AWAY"
  | "NOT_DUPLICATE"
  | "TURNED_18"
  | "CORRECT_DETAILS";

export type ClaimEvent =
  | { type: "DRAFT_COMPLETED" }
  | { type: "SUBMIT" }
  | { type: "BLO_SCHEDULED"; visitDate: string }
  | { type: "HEARING_NOTICED"; hearingDate: string }
  | { type: "ORDER_ISSUED"; outcome: "RESTORED" | "REJECTED"; reason: string }
  | { type: "FILE_APPEAL" }
  | { type: "APPEAL_DECIDED"; outcome: "RESTORED" | "REJECTED"; reason: string };

export interface Notification {
  at: string;
  channel: "sms";
  text: { en: string; kn: string; hi: string };
}

export interface HistoryEntry {
  state: ClaimState;
  at: string;
  note?: string;
}

export interface Claim {
  id: string;
  memberId: string;
  memberName: string;
  form: "6" | "8";
  ground: Ground;
  state: ClaimState;
  ackNo?: string;
  submittedAt?: string;
  orderedAt?: string;
  history: HistoryEntry[];
  notifications: Notification[];
}
