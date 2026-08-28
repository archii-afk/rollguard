import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBar, Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";
import { EntryDocket } from "@/components/EntryDocket";
import { ConsentRecord } from "@/components/ConsentRecord";

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

  it("gives every shell link a 44 pixel target", () => {
    const html = renderToStaticMarkup(<Shell>Body</Shell>);
    for (const href of ["#main", "/", "/about"]) {
      expect(html).toMatch(new RegExp(`<a(?=[^>]*href="${href}")(?=[^>]*min-h-11)(?=[^>]*min-w-11)[^>]*>`));
    }
  });

  it("renders a single semantic page heading", () => {
    const html = renderToStaticMarkup(<PageHeader eyebrow="Part 112" title="Your household" description="Review every name." />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Review every name.");
  });

  it("renders the EPIC entry docket with its voter lookup affordances", () => {
    const html = renderToStaticMarkup(
      <EntryDocket
        stage="epic"
        epic="ZZK1400001"
        otp=""
        error={null}
        busy={false}
        onEpicChange={() => {}}
        onOtpChange={() => {}}
        onUseDemo={() => {}}
        onSendOtp={() => {}}
        onEditEpic={() => {}}
        onVerify={() => {}}
      />,
    );

    expect(html).toContain("Start with one voter");
    expect(html).toContain("Any one EPIC number from your house");
    expect(html).toContain("Use demo EPIC ZZK1400001");
    expect(html).toContain("Send OTP");
  });

  it("renders the OTP docket with a way to amend the EPIC", () => {
    const html = renderToStaticMarkup(
      <EntryDocket
        stage="otp"
        epic="ZZK1400001"
        otp="123456"
        error="No household found for ZZK1400001."
        busy={false}
        onEpicChange={() => {}}
        onOtpChange={() => {}}
        onUseDemo={() => {}}
        onSendOtp={() => {}}
        onEditEpic={() => {}}
        onVerify={() => {}}
      />,
    );

    expect(html).toContain("Verify this household");
    expect(html).toContain("OTP sent to the mobile linked to this EPIC");
    expect(html).toContain("Edit EPIC");
    expect(html).toContain("Check my family");
    expect(html).toContain('role="alert"');
  });

  it("renders the consent record disclosures before access is granted", () => {
    const html = renderToStaticMarkup(
      <ConsentRecord house={{ houseNo: "14", partNo: 112, n: 4 }} />,
    );

    expect(html).toContain("Consent to read");
    expect(html).toContain("Mock consent");
    expect(html).toContain("Roll entries for");
    expect(html).toContain("Versions");
    expect(html).toContain("For how long");
    expect(html).toContain("Shared with");
    expect(html).toContain("This session reads two synthetic electoral-roll snapshots and nothing else.");
  });
});
