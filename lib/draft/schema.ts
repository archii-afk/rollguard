import { z } from "zod";

export const DraftSchema = z.object({
  form: z.enum(["6", "8"]),
  fields: z.array(z.object({
    key: z.string(),
    label: z.string(),
    value: z.string(),
  })),
  declaration: z.object({
    en: z.string(),
    kn: z.string(),
    hi: z.string(),
  }),
  evidenceChecklist: z.array(z.string()),
});
