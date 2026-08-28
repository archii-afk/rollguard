import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import About from "@/app/about/page";
import { QueueSummary } from "@/components/QueueSummary";

describe("officer queue and trust ledger", () => {
  it("summarizes the officer queue without implying a real login", () => {
    const html = renderToStaticMarkup(<QueueSummary total={4} dueSoon={2} groups={3} />);

    expect(html).toContain("Total claims");
    expect(html).toContain("4");
    expect(html).toContain("Awaiting field visit");
    expect(html).toContain("2");
    expect(html).toContain("Active stages");
    expect(html).toContain("3");
    expect(html).not.toContain("login");
  });

  it("renders the trust ledger with prototype boundaries and offline disclosures", () => {
    const html = renderToStaticMarkup(<About />);

    expect(html).toContain("Trust ledger");
    expect(html).toContain("What is real, what is mocked");
    expect(html).toContain("It is not an Election Commission of India product");
    expect(html).toContain("Working today");
    expect(html).toContain("Mocked");
    expect(html).toContain("Deadlines used by the state machine");
    expect(html).toContain("Known limitations");
    expect(html).toContain("AI on this deployment: disabled");
    expect(html).toContain("no database configured on this deployment");
  });
});
