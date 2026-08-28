import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBar, Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";

describe("Civic Ledger shell", () => {
  it("maps the five route steps onto four visible journey phases", () => {
    const html = renderToStaticMarkup(<Shell step={2}><p>Consent</p></Shell>);
    expect(html).toContain("Check");
    expect(html).toContain('aria-current="step"');
    expect(html).toContain("2 of 5");
    expect(html).toContain("Not an official Election Commission product");
  });

  it("exposes workspace width and a labeled action region", () => {
    expect(renderToStaticMarkup(<Shell width="workspace">Body</Shell>)).toContain("max-w-workspace");
    expect(renderToStaticMarkup(<ActionBar width="workspace">Act</ActionBar>)).toContain('aria-label="Page actions"');
  });

  it("renders a single semantic page heading", () => {
    const html = renderToStaticMarkup(<PageHeader eyebrow="Part 112" title="Your household" description="Review every name." />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Review every name.");
  });
});
