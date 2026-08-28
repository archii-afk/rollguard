import { MockBadge } from "@/components/MockBadge";
import type { Ground } from "@/lib/claims";

export const CLAIM_GROUNDS: Record<Ground, { title: string; detail: string }> = {
  ALIVE_RESIDENT: { title: "They are alive and live here", detail: "The roll is wrong about the person, not about the address." },
  NEVER_SHIFTED: { title: "They never moved away", detail: "Still ordinarily resident at this house; the BLO could not find them at home." },
  RESIDENT_WAS_AWAY: { title: "They live here but were away", detail: "Work, study or hospital — temporarily absent, not shifted." },
  NOT_DUPLICATE: { title: "It is the same person, entered twice", detail: "One entry with a spelling variant should be corrected, not deleted." },
  TURNED_18: { title: "They turned 18 and are not enrolled yet", detail: "First-time inclusion for a new voter in this house." },
  CORRECT_DETAILS: { title: "Correct the details on the entry", detail: "Name, age, relation or house number is wrong on the draft roll." },
};

export const CLAIM_EVIDENCE: Record<Ground, string[]> = {
  ALIVE_RESIDENT: ["Any photo ID (Aadhaar masked, ration card, bank passbook)", "Recent utility bill or rent agreement for this house", "Elector will appear before the BLO or ERO in person"],
  NEVER_SHIFTED: ["Any photo ID with this address", "Recent utility bill or rent agreement", "Neighbour or RWA letter confirming residence"],
  RESIDENT_WAS_AWAY: ["Any photo ID with this address", "Proof of temporary absence (employer letter, hospital record)"],
  NOT_DUPLICATE: ["Photo ID showing the correct spelling", "Previous roll extract with the original serial", "Birth certificate or school record showing date of birth"],
  TURNED_18: ["Proof of date of birth (birth certificate, Class 10 marksheet)", "Proof of residence at this house", "Passport-size photograph"],
  CORRECT_DETAILS: ["Photo ID showing the correct details", "Any document supporting the corrected field"],
};

export function ClaimDecisionFields({
  ground,
  options,
  evidence,
  evidenceOptions,
  onGroundChange,
  onEvidenceChange,
}: {
  ground: Ground | null;
  options: readonly Ground[];
  evidence: string[];
  evidenceOptions: readonly string[];
  onGroundChange: (ground: Ground) => void;
  onEvidenceChange: (evidence: string[]) => void;
}) {
  return (
    <div className="claim-controls">
      <fieldset className="claim-fieldset">
        <legend>Why is the draft roll wrong?</legend>
        <div className="grid gap-2">
          {options.map((option) => (
            <label key={option} className={`flex gap-3 rounded-md border bg-card px-3 py-3 cursor-pointer ${ground === option ? "border-violet ring-2 ring-violet/20" : "border-line"}`}>
              <input type="radio" name="ground" className="mt-1 accent-violet" checked={ground === option} onChange={() => onGroundChange(option)} />
              <span>
                <span className="block font-medium">{CLAIM_GROUNDS[option].title}</span>
                <span className="block text-sm text-muted">{CLAIM_GROUNDS[option].detail}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {ground && (
        <fieldset className="claim-fieldset">
          <legend className="flex flex-wrap items-center gap-2">
            Evidence you can attach <MockBadge label="placeholder · nothing is uploaded" />
          </legend>
          <div className="grid gap-2">
            {evidenceOptions.map((option) => {
              const selected = evidence.includes(option);
              return (
                <label key={option} className={`flex gap-3 rounded-md border bg-card px-3 py-3 cursor-pointer text-sm ${selected ? "border-violet" : "border-line"}`}>
                  <input type="checkbox" className="mt-0.5 accent-violet" checked={selected} onChange={() => onEvidenceChange(selected ? evidence.filter((item) => item !== option) : [...evidence, option])} />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}
    </div>
  );
}
