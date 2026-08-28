import type { RollEntry, DraftEntry } from "@/lib/rolls/types";
import { normaliseName } from "./normalise";
import { jaroWinkler } from "./jaroWinkler";

export interface Candidate { entry: DraftEntry; score: number; rules: string[] }

export function prefilter(prev: RollEntry, draftEntries: DraftEntry[]): Candidate[] {
  const pn = normaliseName(prev.name.en); const pr = normaliseName(prev.relationName.en);
  const out: Candidate[] = [];
  for (const d of draftEntries) {
    if (d.partNo !== prev.partNo || d.epic === prev.epic) continue;
    const rules: string[] = [];
    const nameScore = jaroWinkler(pn, normaliseName(d.name.en));
    if (d.houseNo === prev.houseNo) rules.push("same-house");
    if (nameScore >= 0.85) rules.push("name-close"); else if (nameScore >= 0.6) rules.push("name-similar");
    if (Math.abs(d.age - (prev.age + 1)) <= 2) rules.push("age-consistent");
    if (jaroWinkler(pr, normaliseName(d.relationName.en)) >= 0.85) rules.push("relation-match");
    if (d.gender === prev.gender) rules.push("gender-match");
    const passes = rules.includes("age-consistent") && (rules.includes("same-house") || nameScore >= 0.6) && nameScore >= 0.6;
    if (passes) out.push({ entry: d, score: Number((0.6 * nameScore + 0.1 * rules.length).toFixed(3)), rules });
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 3);
}
