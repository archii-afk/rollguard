import { NextResponse } from "next/server";
import { z } from "zod";
import type { ApiError, HouseholdResponse } from "@/lib/api/types";
import { resolveHousehold } from "@/lib/diff";
import { getOpenAI, MODEL } from "@/lib/openai/client";

export const runtime = "nodejs";
export const maxDuration = 60;

const HouseholdRequestSchema = z.object({ epic: z.string().min(1) });

export async function POST(req: Request): Promise<Response> {
  try {
    const body = await req.json().catch(() => undefined);
    const parsed = HouseholdRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiError>(
        { error: "BAD_REQUEST", message: "A valid EPIC is required." },
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

    const response: HouseholdResponse = {
      ...resolved,
      ai: { available: getOpenAI() !== null, model: MODEL },
    };
    return NextResponse.json(response);
  } catch {
    return NextResponse.json<ApiError>(
      { error: "INTERNAL", message: "Unable to resolve the household." },
      { status: 500 },
    );
  }
}
