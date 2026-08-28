import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClaimDecisionFields } from "@/components/ClaimDecisionFields";
import { FormPreview } from "@/components/FormPreview";
import { LangTabs, nextLanguageForKey, tabIdForLanguage } from "@/components/LangTabs";
import { ClaimCard } from "@/components/ClaimCard";
import { deriveClaimWorkspaceInitialState } from "@/app/member/[id]/claim/page";
import { createClaim } from "@/lib/claims";

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

  it("connects language tabs to their active form panel", () => {
    const panelId = "ameena-form-panel";
    const activeTabId = tabIdForLanguage(panelId, "en");
    const tabs = renderToStaticMarkup(<LangTabs value="en" panelId={panelId} label="Form language" onChange={() => {}} />);
    const preview = renderToStaticMarkup(<FormPreview draft={draft} lang="en" panelId={panelId} tabId={activeTabId} />);

    expect(tabs).toContain('role="tablist"');
    expect(tabs).toContain('aria-label="Form language"');
    expect(tabs).toContain(`id="${activeTabId}"`);
    expect(tabs).toContain(`aria-controls="${panelId}"`);
    expect(tabs).toContain('aria-selected="true"');
    expect(tabs).toContain('tabindex="0"');
    expect(preview).toContain('<section');
    expect(preview).toContain(`id="${panelId}"`);
    expect(preview).toContain('role="tabpanel"');
    expect(preview).toContain(`aria-labelledby="${activeTabId}"`);
    expect(preview).toContain('aria-label="en form preview"');
    expect(preview).toContain("Alive and ordinarily resident at this address");
    expect(preview).toContain("Aadhaar masked");
  });

  it("maps tab navigation keys across the three form languages", () => {
    expect(nextLanguageForKey("en", "ArrowLeft")).toBe("hi");
    expect(nextLanguageForKey("en", "ArrowRight")).toBe("kn");
    expect(nextLanguageForKey("hi", "Home")).toBe("en");
    expect(nextLanguageForKey("en", "End")).toBe("hi");
    expect(nextLanguageForKey("kn", "Escape")).toBeNull();
  });

  it("derives each workspace's initial ground and saved draft without an initialization effect", () => {
    const savedDraft = {
      source: "fallback" as const,
      draft: { ...draft, fields: [{ key: "ground", label: "Reason for claim", value: "NEVER_SHIFTED" }] },
      model: undefined,
    };

    expect(deriveClaimWorkspaceInitialState(["ALIVE_RESIDENT"], savedDraft)).toEqual({
      ground: "NEVER_SHIFTED",
      evidence: [],
      draft: savedDraft,
    });
    expect(deriveClaimWorkspaceInitialState(["ALIVE_RESIDENT"], null)).toEqual({
      ground: "ALIVE_RESIDENT",
      evidence: [],
      draft: null,
    });
  });

  it("gives every claim card's message language tabs their own panel", () => {
    const claim = createClaim({ memberId: "ameena", memberName: "Ameena Begum", form: "6", ground: "ALIVE_RESIDENT" }, new Date("2026-08-28"));
    const panelId = `claim-${claim.id}-messages-panel`;
    const tabId = tabIdForLanguage(panelId, "en");
    const html = renderToStaticMarkup(<ClaimCard claim={claim} onEvent={() => {}} />);

    expect(html).toContain(`id="${panelId}"`);
    expect(html).toContain(`aria-controls="${panelId}"`);
    expect(html).toContain(`aria-labelledby="${tabId}"`);
    expect(html).toContain('aria-label="Message language"');
  });
});
