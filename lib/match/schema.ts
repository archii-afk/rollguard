import { z } from "zod";

export const RankingSchema = z.object({
  rankings: z.array(z.object({
    candidateSerial: z.number(),
    sameProbability: z.number().min(0).max(1),
    reasons: z.array(z.string()),
  })),
});
