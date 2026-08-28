import { z } from "zod";
import { DeadlineMissed, InvalidTransition } from "@/lib/claims";
import { getPool, PgClaimStore, StateConflict } from "@/lib/claims/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const ClaimStateSchema = z.enum([
  "DRAFT_PUBLISHED",
  "CLAIM_DRAFTED",
  "CLAIM_SUBMITTED",
  "BLO_FIELD_VERIFICATION",
  "ERO_HEARING_NOTICE",
  "ERO_SPEAKING_ORDER",
  "RESTORED",
  "REJECTED",
  "APPEAL_FILED",
  "APPEAL_REJECTED",
]);
const EventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("DRAFT_COMPLETED") }),
  z.object({ type: z.literal("SUBMIT") }),
  z.object({ type: z.literal("BLO_SCHEDULED"), visitDate: z.string().min(1) }),
  z.object({ type: z.literal("HEARING_NOTICED"), hearingDate: z.string().min(1) }),
  z.object({
    type: z.literal("ORDER_ISSUED"),
    outcome: z.enum(["RESTORED", "REJECTED"]),
    reason: z.string(),
  }),
  z.object({ type: z.literal("FILE_APPEAL") }),
  z.object({
    type: z.literal("APPEAL_DECIDED"),
    outcome: z.enum(["RESTORED", "REJECTED"]),
    reason: z.string(),
  }),
]);
const EventRequestSchema = z.object({
  expectedState: ClaimStateSchema,
  event: EventSchema,
});

function error(error: string, message: string, status: number): Response {
  return Response.json({ error, message }, { status });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const pool = getPool();
  if (!pool) return Response.json({ error: "NO_DB" }, { status: 503 });
  const parsed = EventRequestSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return error("BAD_REQUEST", "A valid claim event is required.", 400);
  const { id } = await params;
  try {
    const store = new PgClaimStore(pool);
    const claim = await store.applyEvent(
      id,
      parsed.data.expectedState,
      parsed.data.event,
      new Date(),
    );
    return Response.json({ claim });
  } catch (caught) {
    if (caught instanceof StateConflict) {
      return error("STATE_CONFLICT", caught.message, 409);
    }
    if (caught instanceof InvalidTransition) {
      return error("INVALID_TRANSITION", caught.message, 422);
    }
    if (caught instanceof DeadlineMissed) {
      return error("DEADLINE_MISSED", caught.message, 422);
    }
    return error("INTERNAL", "Unable to apply claim event.", 500);
  }
}
