import type OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { Candidate } from "@/lib/diff";
import type { HouseholdMember, RollEntry } from "@/lib/rolls/types";
import { getOpenAI, MODEL, withTimeout } from "@/lib/openai/client";
import { RankingSchema } from "./schema";

export interface Ranking {
  candidateSerial: number;
  sameProbability: number;
  reasons: string[];
}

export interface RankResult {
  rankings: Ranking[];
  source: "openai" | "fallback";
  model?: string;
  promptVersion: "match-v1";
}

function fallback(candidates: Candidate[]): RankResult {
  return {
    rankings: candidates.map(candidate => ({
      candidateSerial: candidate.entry.serial,
      sameProbability: Math.min(0.95, candidate.score + 0.2),
      reasons: candidate.rules,
    })),
    source: "fallback",
    promptVersion: "match-v1",
  };
}

export async function rankMatches(
  member: HouseholdMember,
  prev: RollEntry,
  candidates: Candidate[],
  deps: { client?: OpenAI | null } = {},
): Promise<RankResult> {
  const client = deps.client === undefined ? getOpenAI() : deps.client;
  if (!client) return fallback(candidates);

  const input = [
    {
      role: "system" as const,
      content: "You compare an Indian electoral roll entry against candidate entries from a newer roll and judge whether they are the same person. Consider transliteration variants (Md./Mohammed, Rafik/Rafeeq), Kannada↔Latin spellings, age drift of about +1 year between rolls, same house number, and father/husband name. Output one ranking per candidate.",
    },
    {
      role: "user" as const,
      content: JSON.stringify({ previous: prev, candidates: candidates.map(candidate => candidate.entry) }),
    },
  ];

  try {
    const response = await withTimeout(client.responses.parse({
      model: MODEL,
      input,
      text: { format: zodTextFormat(RankingSchema, "rankings") },
    }), 15_000);
    const parsed = RankingSchema.parse(response.output_parsed);
    return {
      rankings: parsed.rankings,
      source: "openai",
      model: MODEL,
      promptVersion: "match-v1",
    };
  } catch {
    return fallback(candidates);
  }
}
