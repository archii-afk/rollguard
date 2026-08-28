import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClaimNow } from "@/components/ClaimNow";
import { ClaimCard } from "@/components/ClaimCard";
import { deriveClaimsInitialState } from "@/app/claims/page";
import { createClaim, transition } from "@/lib/claims";
import type { HouseholdResponse } from "@/lib/api/types";
import type { Claim } from "@/lib/claims";

describe("claim tracker", () => {
  it("leads a scheduled visit with the current state and visit date", () => {
    const claim = {
      state: "BLO_FIELD_VERIFICATION",
      history: [{ state: "BLO_FIELD_VERIFICATION", at: "2026-08-28T00:00:00.000Z", note: "Visit scheduled for 2 September" }],
    } as Claim;

    const html = renderToStaticMarkup(<ClaimNow claim={claim} />);

    expect(html).toContain("Currently");
    expect(html).toContain("BLO field verification");
    expect(html).toContain("Visit scheduled for 2 September");
  });

  it("places the current status before the timeline and phone messages", () => {
    const submitted = transition(
      createClaim({ memberId: "ameena", memberName: "Ameena Begum", form: "6", ground: "ALIVE_RESIDENT" }, new Date("2026-08-28")),
      { type: "SUBMIT" },
      new Date("2026-08-28"),
    );
    const claim = transition(submitted, { type: "BLO_SCHEDULED", visitDate: "2026-09-02" }, new Date("2026-08-28"));
    const html = renderToStaticMarkup(<ClaimCard claim={claim} onEvent={() => {}} />);

    expect(html).toContain('class="claim-record');
    expect(html).toContain('aria-labelledby="timeline-' + claim.id + '"');
    expect(html).toContain('aria-labelledby="messages-' + claim.id + '"');
    expect(html.indexOf('class="claim-now"')).toBeLessThan(html.indexOf("Where the claim is"));
    expect(html.indexOf("Where the claim is")).toBeLessThan(html.indexOf("Messages to your phone"));
  });

  it("derives tracker routing from a loaded household without an effect-set flag", () => {
    const household = {
      household: { members: [{ epic: "ZZK1400007" }] },
    } as HouseholdResponse;

    expect(deriveClaimsInitialState(household)).toEqual({ epic: "ZZK1400007", hasHousehold: true });
    expect(deriveClaimsInitialState(null)).toEqual({ epic: "ZZK1400001", hasHousehold: false });
  });
});
