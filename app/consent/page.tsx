"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";
import { ConsentRecord } from "@/components/ConsentRecord";
import { loadHousehold } from "@/lib/client/session";

export default function Consent() {
  const router = useRouter();
  const [house] = useState(() => {
    const h = loadHousehold();
    return h ? { houseNo: h.household.houseNo, partNo: h.household.partNo, n: h.assessments.length } : null;
  });

  useEffect(() => {
    if (!house) {
      router.replace("/");
    }
  }, [house, router]);

  return (
    <Shell step={2} width="workspace">
      <PageHeader
        eyebrow="Check · consent"
        title="Before we read the roll"
        description="You control what RollGuard reads for this check."
      />
      <div className="consent-layout">
        <ConsentRecord house={house} />
      </div>

      <ActionBar width="workspace">
        <SecondaryButton onClick={() => router.push("/")}>Deny</SecondaryButton>
        <PrimaryButton disabled={!house} onClick={() => router.push("/household")}>
          Allow and continue
        </PrimaryButton>
      </ActionBar>
    </Shell>
  );
}
