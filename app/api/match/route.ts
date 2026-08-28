import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiError, MatchResponse } from "@/lib/api/types";
import { resolveHousehold } from "@/lib/diff";
import { rankMatches } from "@/lib/match";

export const runtime = "nodejs";

const MatchRequestSchema = z.object({
  epic: z.string().min(1),
  memberId: z.string().min(1),
});

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => undefined);
    const parsed = MatchRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: "BAD_REQUEST", message: "A valid EPIC and member ID are required." },
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

    const assessment = resolved.assessments.find(item => item.member.id === parsed.data.memberId);
    if (!assessment) {
      return NextResponse.json<ApiError>(
        { error: "NO_MEMBER", message: "No household member was found for this member ID." },
        { status: 404 },
      );
    }
    if (!assessment.previous || assessment.candidates.length === 0) {
      return NextResponse.json<ApiError>(
        { error: "NO_CANDIDATES", message: "This member has no ambiguous match candidates." },
        { status: 400 },
      );
    }

    const response: MatchResponse = await rankMatches(
      assessment.member,
      assessment.previous,
      assessment.candidates,
    );
    return NextResponse.json(response);
  } catch {
    return NextResponse.json<ApiError>(
      { error: "INTERNAL", message: "Unable to rank match candidates." },
      { status: 500 },
    );
  }
}
