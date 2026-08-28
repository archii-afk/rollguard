import type { Household } from "@/lib/rolls/types";
import type { MemberAssessment } from "@/lib/diff";
import type { RankResult } from "@/lib/match";
import type { DraftResult } from "@/lib/draft";
import type { Ground } from "@/lib/claims";

/** Shared request/response contracts between app/api/* and the client. Keep in sync with the route handlers. */

export interface HouseholdRequest {
  epic: string;
}
export interface HouseholdResponse {
  household: Household;
  assessments: MemberAssessment[];
  ai: { available: boolean; model: string };
}

export interface MatchRequest {
  epic: string;
  memberId: string;
}
export type MatchResponse = RankResult;

export interface DraftRequest {
  epic: string;
  memberId: string;
  ground: Ground;
  evidence: string[];
  candidateSerial?: number;
}
export type DraftResponse = DraftResult & { assessment: MemberAssessment };

export interface ApiError {
  error: "BAD_REQUEST" | "NO_HOUSEHOLD" | "NO_MEMBER" | "NO_CANDIDATES" | "INTERNAL";
  message: string;
}
