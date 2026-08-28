import { MockBadge } from "@/components/MockBadge";

type HouseholdSummary = { houseNo: string; partNo: number; n: number } | null;

export function ConsentRecord({ house }: { house: HouseholdSummary }) {
  return (
    <>
      <section className="record-card consent-record" aria-labelledby="consent-title">
        <header className="consent-record-header">
          <h2 id="consent-title">Consent to read</h2>
          <MockBadge label="Mock consent" />
        </header>
        <Row k="What">
          Roll entries for <strong>House {house?.houseNo ?? "…"}, Part {house?.partNo ?? "…"}</strong>, AC 153 Shantinagar — {house?.n ?? "…"} adult members
        </Row>
        <Row k="Versions">Roll of Jan 2025 and the SIR draft roll of Aug 2026</Row>
        <Row k="Purpose">To check who was removed or changed, and help you file a claim to restore names</Row>
        <Row k="For how long">This session only. Closing the tab forgets everything.</Row>
        <Row k="Shared with">No one. Claims you file are stored on this phone until you submit them.</Row>
      </section>
      <aside className="trust-note">This session reads two synthetic electoral-roll snapshots and nothing else.</aside>
    </>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="consent-record-row">
      <span className="text-muted">{k}</span>
      <span>{children}</span>
    </div>
  );
}
