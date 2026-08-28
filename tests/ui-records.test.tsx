import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecordMeta } from "@/components/RecordMeta";
import { StatusChip } from "@/components/StatusChip";
import { MockBadge } from "@/components/MockBadge";

describe("record components", () => {
  it("renders labeled record values as a definition list", () => {
    const html = renderToStaticMarkup(
      <RecordMeta items={[{ label: "Part", value: 112 }, { label: "House", value: 14 }]} />,
    );
    expect(html).toContain("<dl");
    expect(html).toContain("<dt>Part</dt>");
    expect(html).toContain("<dd>112</dd>");
  });

  it("puts status meaning in text rather than color alone", () => {
    expect(renderToStaticMarkup(<StatusChip status="MARKED_DEAD" />)).toContain("Marked deceased");
  });

  it("labels mocked behavior explicitly", () => {
    expect(renderToStaticMarkup(<MockBadge label="mock OTP" />)).toContain("mock OTP");
  });
});
