import { z } from "zod";
import { createClaim, DeadlineMissed, transition } from "@/lib/claims";
import { getPool, PgClaimStore, seedDemo } from "@/lib/claims/db";

export const runtime = "nodejs";
export const maxDuration = 30;

const EpicSchema = z.string().startsWith("ZZK").min(4);
const ClaimRequestSchema = z.object({
  epic: EpicSchema,
  memberId: z.string().min(1),
  memberName: z.string().min(1),
  form: z.enum(["6", "8"]),
  ground: z.enum([
    "ALIVE_RESIDENT",
    "NEVER_SHIFTED",
    "RESIDENT_WAS_AWAY",
    "NOT_DUPLICATE",
    "TURNED_18",
    "CORRECT_DETAILS",
  ]),
});

function error(error: string, message: string, status: number): Response {
  return Response.json({ error, message }, { status });
}

function database(): PgClaimStore | null {
  const pool = getPool();
  return pool ? new PgClaimStore(pool) : null;
}

export async function GET(request: Request): Promise<Response> {
  const store = database();
  if (!store) return Response.json({ error: "NO_DB" }, { status: 503 });
  try {
    const searchParams = new URL(request.url).searchParams;
    if (searchParams.get("scope") === "all") {
      return Response.json({ claims: await store.listAll() });
    }
    const parsedEpic = EpicSchema.safeParse(searchParams.get("epic"));
    if (!parsedEpic.success) return error("BAD_REQUEST", "A valid EPIC is required.", 400);
    await seedDemo(store, parsedEpic.data);
    return Response.json({
      claims: await store.listByHousehold(parsedEpic.data),
      persistence: "postgres",
    });
  } catch {
    return error("INTERNAL", "Unable to list claims.", 500);
  }
}

export async function POST(request: Request): Promise<Response> {
  const store = database();
  if (!store) return Response.json({ error: "NO_DB" }, { status: 503 });
  const parsed = ClaimRequestSchema.safeParse(await request.json().catch(() => undefined));
  if (!parsed.success) return error("BAD_REQUEST", "A valid claim is required.", 400);
  try {
    const { epic, ...input } = parsed.data;
    const now = new Date();
    const claim = transition(createClaim(input, now), { type: "SUBMIT" }, now);
    await store.insert(claim, epic);
    return Response.json({ claim }, { status: 201 });
  } catch (caught) {
    if (caught instanceof DeadlineMissed) {
      return error("DEADLINE_MISSED", caught.message, 422);
    }
    return error("INTERNAL", "Unable to create claim.", 500);
  }
}

export async function DELETE(request: Request): Promise<Response> {
  const store = database();
  if (!store) return Response.json({ error: "NO_DB" }, { status: 503 });
  const parsedEpic = EpicSchema.safeParse(new URL(request.url).searchParams.get("epic"));
  if (!parsedEpic.success) return error("BAD_REQUEST", "A valid EPIC is required.", 400);
  try {
    await store.deleteByHousehold(parsedEpic.data);
    await seedDemo(store, parsedEpic.data);
    return Response.json({ claims: await store.listByHousehold(parsedEpic.data) });
  } catch {
    return error("INTERNAL", "Unable to reset claims.", 500);
  }
}
