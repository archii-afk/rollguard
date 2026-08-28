import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HouseholdSummary } from "@/components/HouseholdSummary";

describe("household review", () => {
  it("summarizes status counts with labels", () => {
    const html = renderToStaticMarkup(
      <HouseholdSummary total={6} action={2} confirm={1} fresh={1} correct={2} />,
    );

    expect(html).toContain("<dl");
    expect(html).toContain("6");
    expect(html).toContain("Members");
    expect(html).toContain("Need action");
    expect(html).toContain("Need confirmation");
  });
});
