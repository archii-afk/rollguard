import type OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAI, MODEL, withTimeout } from "@/lib/openai/client";
import { DraftSchema } from "./schema";
import { formFor, templateDraft, type DraftInput, type DraftOutput } from "./templates";

export interface DraftResult {
  draft: DraftOutput;
  source: "openai" | "fallback";
  model?: string;
  promptVersion: "draft-v1";
}

function fallback(input: DraftInput): DraftResult {
  return {
    draft: templateDraft(input),
    source: "fallback",
    promptVersion: "draft-v1",
  };
}

export async function draftClaim(
  input: DraftInput,
  deps: { client?: OpenAI | null } = {},
): Promise<DraftResult> {
  const client = deps.client === undefined ? getOpenAI() : deps.client;
  if (!client) return fallback(input);

  const { assessment } = input;
  const userContent = {
    member: assessment.member,
    previousRollEntry: assessment.previous ?? null,
    draftRollEntry: assessment.draft ?? null,
    status: assessment.status,
    ground: input.ground,
    provenance: assessment.provenance,
    evidence: input.evidence,
    acName: input.acName,
    partNo: input.partNo,
    formHint: formFor(assessment.status, input.ground),
  };

  try {
    const response = await withTimeout(client.responses.parse({
      model: MODEL,
      reasoning: { effort: "low" },
      input: [
        {
          role: "system",
          content: "You draft Indian electoral roll claim forms (Form 6 inclusion, Form 8 correction) for a citizen contesting a wrongful SIR deletion. Be factual, cite the provided roll provenance, never invent documents or numbers, keep declarations under 120 words per language, produce natural Kannada and Hindi (not transliteration). The fields array must contain exactly these keys in this order: name, epic, relationName, houseNo, partNo, acName, age, ground — with ground set to the ground code you were given, and epic set to \"—\" when the member has none.",
        },
        { role: "user", content: JSON.stringify(userContent) },
      ],
      text: { format: zodTextFormat(DraftSchema, "claim_draft") },
    }), 30_000);
    const parsed = DraftSchema.safeParse(response.output_parsed);
    if (!parsed.success) return fallback(input);
    return {
      draft: parsed.data,
      source: "openai",
      model: MODEL,
      promptVersion: "draft-v1",
    };
  } catch {
    return fallback(input);
  }
}
