import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClaimDecisionFields } from "@/components/ClaimDecisionFields";
import { FormPreview } from "@/components/FormPreview";
import { LangTabs } from "@/components/LangTabs";

const groundOptions = ["ALIVE_RESIDENT", "RESIDENT_WAS_AWAY"] as const;
const evidenceOptions = ["Aadhaar masked", "Recent utility bill"];
const draft = {
  form: "6" as const,
  fields: [
    { key: "ground", label: "Reason for claim", value: "ALIVE_RESIDENT" },
    { key: "epic", label: "EPIC", value: "ZZK1400001" },
  ],
  declaration: { en: "I live at this address.", kn: "ನಾನು ಈ ವಿಳಾಸದಲ್ಲಿ ವಾಸಿಸುತ್ತೇನೆ.", hi: "मैं इस पते पर रहता हूँ।" },
  evidenceChecklist: ["Aadhaar masked"],
};

describe("claim preparation", () => {
  it("groups the available reason and evidence decisions in labeled fieldsets", () => {
    const html = renderToStaticMarkup(
      <ClaimDecisionFields
        ground="ALIVE_RESIDENT"
        options={groundOptions}
        evidence={evidenceOptions}
        evidenceOptions={evidenceOptions}
        onGroundChange={() => {}}
        onEvidenceChange={() => {}}
      />,
    );

    expect(html).toContain("<fieldset");
    expect(html).toContain("Why is the draft roll wrong?");
    expect(html).toContain("Evidence you can attach");
    expect(html).toContain("They are alive and live here");
    expect(html).toContain("They live here but were away");
    expect(html).toContain("Aadhaar masked");
    expect(html).toContain("Recent utility bill");
  });

  it("connects language tabs to the accessible prepared form", () => {
    const tabs = renderToStaticMarkup(<LangTabs value="en" onChange={() => {}} />);
    const preview = renderToStaticMarkup(<FormPreview draft={draft} lang="en" />);

    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('aria-label="Form language"');
    expect(tabs).toContain('aria-controls="form-language-panel"');
    expect(tabs).toContain('aria-selected="true"');
    expect(preview).toContain('<section');
    expect(preview).toContain('id="form-language-panel"');
    expect(preview).toContain('role="tabpanel"');
    expect(preview).toContain('aria-label="en form preview"');
    expect(preview).toContain("Alive and ordinarily resident at this address");
    expect(preview).toContain("Aadhaar masked");
  });
});
