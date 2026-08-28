"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { StatusChip, Stamp, STATUS_META } from "@/components/StatusChip";
import { ProvenanceCard } from "@/components/ProvenanceCard";
import { ListSkeleton } from "@/components/Skeleton";
import { loadHousehold, loadConfirmations } from "@/lib/client/session";
import { applyConfirmation } from "@/lib/client/applyConfirmation";
import { explainStatus, type MemberAssessment } from "@/lib/diff";
import type { HouseholdResponse } from "@/lib/api/types";

export default function MemberDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<HouseholdResponse | null>(null);
  const [a, setA] = useState<MemberAssessment | null>(null);

  useEffect(() => {
    const h = loadHousehold();
    if (!h) {
      router.replace("/");
      return;
    }
    const raw = h.assessments.find((x) => x.member.id === id);
    if (!raw) {
      router.replace("/household");
      return;
    }
    setData(h);
    setA(applyConfirmation(raw, loadConfirmations()[id]));
  }, [id, router]);

  const explain = useMemo(() => (a ? explainStatus(a.status) : null), [a]);

  if (!a || !explain || !data) {
    return (
      <Shell step={4}>
        <ListSkeleton count={2} label="Loading this entry" />
      </Shell>
    );
  }

  const nothingToDo = a.looksCorrect || a.status === "RETAINED";
  const needsConfirm = a.status === "AMBIGUOUS_MATCH";

  return (
    <Shell step={4}>
      <header className="mb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          {a.member.relationToHead} · House {data.household.houseNo} · Part {data.household.partNo}
        </p>
        <h1 className="font-display font-bold text-[30px] leading-tight tracking-tight mt-1">
          {a.member.name.en} <span className="lang-kn text-muted font-normal text-xl">{a.member.name.kn}</span>
        </h1>
        <div className="mt-2 flex items-center gap-3">
          {/* The stamp already names the status; show the chip only when there is no stamp to show. */}
          {a.looksCorrect || !STATUS_META[a.status].stamp ? (
            <StatusChip status={a.status} looksCorrect={a.looksCorrect} />
          ) : (
            <Stamp status={a.status} animate={false} />
          )}
        </div>
      </header>

      <section className="mb-5">
        <h2 className="font-display font-semibold text-xl mb-1">What went wrong</h2>
        <p className="text-[15px] text-ink/90">
          {a.looksCorrect
            ? `${a.member.name.en.split(" ")[0]} asked to be shifted to another constituency, and the draft roll records exactly that. Contesting it would be wrong — and would slow down the claims that matter.`
            : explain.reason}
        </p>
      </section>

      <section className="mb-5">
        <ProvenanceCard items={a.provenance} />
      </section>

      {!nothingToDo && (
        <section className="mb-5 rounded-md border border-violet/30 bg-violet-soft/50 px-4 py-3">
          <h2 className="font-display font-semibold text-lg mb-1">What the law requires</h2>
          <p className="text-sm text-ink/90">{explain.lawRequires}</p>
        </section>
      )}

      {needsConfirm && (
        <p className="mb-5 text-sm text-ink/85">
          A similar entry exists on the draft roll. Go back to the family board and confirm whether it is {a.member.name.en.split(" ")[0]} before drafting a claim.
        </p>
      )}

      <ActionBar>
        <SecondaryButton onClick={() => router.push("/household")}>Back</SecondaryButton>
        {nothingToDo ? (
          <PrimaryButton disabled>No action needed</PrimaryButton>
        ) : needsConfirm ? (
          <PrimaryButton onClick={() => router.push("/household")}>Confirm on the board</PrimaryButton>
        ) : (
          <PrimaryButton onClick={() => router.push(`/member/${id}/claim`)}>
            Fix this — draft Form {a.suggestedForm ?? explain.suggestedForm ?? "6"}
          </PrimaryButton>
        )}
      </ActionBar>
    </Shell>
  );
}
