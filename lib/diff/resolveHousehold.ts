import { loadDraftRoll, loadHouseholds, loadPreviousRoll } from "@/lib/rolls/load";
import { classifyMember } from "./classify";

export function resolveHousehold(epic: string) {
  const households = loadHouseholds(); const prev = loadPreviousRoll(); const draft = loadDraftRoll();
  const hh = households.find(h => h.members.some(m => m.epic === epic));
  if (!hh) return null;
  const assessments = hh.members.filter(m => m.age >= 18).map(m => classifyMember(m, prev, draft));
  return { household: hh, assessments };
}
