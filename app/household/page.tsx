"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton } from "@/components/Shell";
import { MemberCard } from "@/components/MemberCard";
import { loadHousehold, loadConfirmations, saveConfirmation, type Confirmations } from "@/lib/client/session";
import { applyConfirmation } from "@/lib/client/applyConfirmation";
import type { HouseholdResponse } from "@/lib/api/types";
import type { MemberAssessment } from "@/lib/diff";

export default function HouseholdBoard() {
  const router = useRouter();
  const [data, setData] = useState<HouseholdResponse | null>(null);
  const [confirmations, setConfirmations] = useState<Confirmations>({});

  useEffect(() => {
    const h = loadHousehold();
    if (!h) {
      router.replace("/");
      return;
    }
    setData(h);
    setConfirmations(loadConfirmations());
  }, [router]);

  const assessments: MemberAssessment[] = useMemo(() => {
    if (!data) return [];
    return data.assessments.map((a) => applyConfirmation(a, confirmations[a.member.id]));
  }, [data, confirmations]);

  const counts = useMemo(() => {
    let action = 0, confirm = 0, correct = 0, fresh = 0, fine = 0;
    for (const a of assessments) {
      if (a.looksCorrect) correct++;
      else if (a.status === "AMBIGUOUS_MATCH") confirm++;
      else if (a.status === "NEW_ELIGIBLE") fresh++;
      else if (a.status === "RETAINED") fine++;
      else action++;
    }
    return { action, confirm, correct, fresh, fine };
  }, [assessments]);

  const firstActionable = assessments.find((a) => !a.looksCorrect && a.status !== "RETAINED" && a.status !== "AMBIGUOUS_MATCH");

  function onConfirm(memberId: string, serial: number | "none") {
    saveConfirmation(memberId, serial);
    setConfirmations((c) => ({ ...c, [memberId]: serial }));
  }

  if (!data) return <Shell step={3} />;

  const { household } = data;
  const summary = [
    counts.action && `${counts.action} need${counts.action === 1 ? "s" : ""} a claim`,
    counts.confirm && `${counts.confirm} to confirm`,
    counts.fresh && `${counts.fresh} new voter`,
    counts.correct && `${counts.correct} looks correct`,
    counts.fine && `${counts.fine} unchanged`,
  ].filter(Boolean).join(" · ");

  return (
    <Shell step={3}>
      <header className="mb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
          AC 153 Shantinagar · Part {household.partNo} · House {household.houseNo}
        </p>
        <h1 className="font-display font-bold text-[30px] leading-tight tracking-tight mt-1">Your family on the draft roll</h1>
        <p className="mt-1 text-[15px] text-ink/85">{summary}</p>
        {!data.ai.available && (
          <p className="mt-2 text-xs text-amber">AI unavailable on the server — identity matches use rule scores only.</p>
        )}
      </header>

      <ol className="space-y-3">
        {assessments.map((a, i) => (
          <li key={a.member.id}>
            <MemberCard
              assessment={a}
              epic={data.household.members.find((m) => m.epic)?.epic ?? ""}
              index={i}
              confirmation={confirmations[a.member.id]}
              onConfirm={onConfirm}
              onOpen={() => router.push(`/member/${a.member.id}`)}
            />
          </li>
        ))}
      </ol>

      <ActionBar>
        <PrimaryButton disabled={!firstActionable} onClick={() => firstActionable && router.push(`/member/${firstActionable.member.id}`)}>
          {counts.action + counts.fresh > 0 ? `Fix ${counts.action + counts.fresh} name${counts.action + counts.fresh === 1 ? "" : "s"}` : "Nothing to fix"}
        </PrimaryButton>
      </ActionBar>
    </Shell>
  );
}
