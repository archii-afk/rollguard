"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { MockBadge } from "@/components/MockBadge";
import { loadHousehold } from "@/lib/client/session";

export default function Consent() {
  const router = useRouter();
  const [house, setHouse] = useState<{ houseNo: string; partNo: number; n: number } | null>(null);

  useEffect(() => {
    const h = loadHousehold();
    if (!h) {
      router.replace("/");
      return;
    }
    setHouse({ houseNo: h.household.houseNo, partNo: h.household.partNo, n: h.assessments.length });
  }, [router]);

  return (
    <Shell step={2} title="Before we read the roll">
      <p className="text-[15px] text-ink/85 mb-4">
        RollGuard reads the electoral roll entries for your house and compares two versions. Nothing else, and nothing leaves this session.
      </p>

      <section className="rounded-md border border-line bg-card divide-y divide-line">
        <header className="px-4 py-3 flex items-center justify-between">
          <span className="font-display font-semibold text-lg">Consent to read</span>
          <MockBadge label="mock consent" />
        </header>
        <Row k="What">
          Roll entries for <strong>House {house?.houseNo ?? "…"}, Part {house?.partNo ?? "…"}</strong>, AC 153 Shantinagar — {house?.n ?? "…"} adult members
        </Row>
        <Row k="Versions">Roll of Jan 2025 and the SIR draft roll of Aug 2026</Row>
        <Row k="Purpose">To check who was removed or changed, and help you file a claim to restore names</Row>
        <Row k="For how long">This session only. Closing the tab forgets everything.</Row>
        <Row k="Shared with">No one. Claims you file are stored on this phone until you submit them.</Row>
      </section>

      <p className="mt-4 text-xs text-muted">
        In production this screen would be a DigiLocker or ECINET consent artefact with an audit log. Here it is a faithful mock.
      </p>

      <ActionBar>
        <SecondaryButton onClick={() => router.push("/")}>Deny</SecondaryButton>
        <PrimaryButton disabled={!house} onClick={() => router.push("/household")}>
          Allow and continue
        </PrimaryButton>
      </ActionBar>
    </Shell>
  );
}

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[92px_1fr] gap-3 px-4 py-3 text-sm">
      <span className="text-muted">{k}</span>
      <span>{children}</span>
    </div>
  );
}
