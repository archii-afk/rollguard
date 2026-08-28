import { NextResponse } from "next/server";
import { z } from "zod";
import type { Ground } from "@/lib/claims";
import type { ApiError, DraftResponse } from "@/lib/api/types";
import { resolveAmbiguous, resolveHousehold } from "@/lib/diff";
import { draftClaim } from "@/lib/draft";
import { loadDraftRoll } from "@/lib/rolls/load";

export const runtime = "nodejs";
export const maxDuration = 60;

const DraftRequestSchema = z.object({
  epic: z.string().min(1),
  memberId: z.string().min(1),
  ground: z.enum([
    "ALIVE_RESIDENT",
    "NEVER_SHIFTED",
    "RESIDENT_WAS_AWAY",
    "NOT_DUPLICATE",
    "TURNED_18",
    "CORRECT_DETAILS",
  ]),
  evidence: z.array(z.string()),
  candidateSerial: z.number().int().optional(),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => undefined);
    const parsed = DraftRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: "BAD_REQUEST", message: "The draft request is invalid." },
        { status: 400 },
      );
    }

    const resolved = resolveHousehold(parsed.data.epic);
    if (!resolved) {
      return NextResponse.json<ApiError>(
        { error: "NO_HOUSEHOLD", message: "No household was found for this EPIC." },
        { status: 404 },
      );
    }

    const found = resolved.assessments.find(item => item.member.id === parsed.data.memberId);
    if (!found) {
      return NextResponse.json<ApiError>(
        { error: "NO_MEMBER", message: "No household member was found for this member ID." },
        { status: 404 },
      );
    }

    const draftRoll = loadDraftRoll();
    const assessment = parsed.data.candidateSerial === undefined
      ? found
      : resolveAmbiguous(found, parsed.data.candidateSerial, draftRoll);
    const result = await draftClaim({
      assessment,
      ground: parsed.data.ground as Ground,
      evidence: parsed.data.evidence,
      acName: draftRoll.acName,
      partNo: draftRoll.partNo,
    });
    const response: DraftResponse = { ...result, assessment };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json<ApiError>(
      { error: "INTERNAL", message: "Unable to draft the claim." },
      { status: 500 },
    );
  }
}
