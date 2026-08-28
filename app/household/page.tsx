"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton } from "@/components/Shell";
import { MemberCard } from "@/components/MemberCard";
import { HouseholdSummary } from "@/components/HouseholdSummary";
import { PageHeader } from "@/components/PageHeader";
import { Skeleton, ListSkeleton } from "@/components/Skeleton";
import { loadHousehold, saveHousehold, loadConfirmations, saveConfirmation, type Confirmations } from "@/lib/client/session";
import { applyConfirmation } from "@/lib/client/applyConfirmation";
import type { HouseholdResponse } from "@/lib/api/types";
import type { MemberAssessment } from "@/lib/diff";

const EMPTY_CONFIRMATIONS: Confirmations = {};

function subscribeToSession() {
  return () => {};
}

function useStoredSessionValue<T>(read: () => T, serverValue: T) {
  const value = useRef<T | undefined>(undefined);
  const getSnapshot = useCallback(() => {
    if (value.current === undefined) value.current = read();
    return value.current;
  }, [read]);
  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);

  return useSyncExternalStore(subscribeToSession, getSnapshot, getServerSnapshot);
}

export default function HouseholdBoard() {
  const router = useRouter();
  const storedHousehold = useStoredSessionValue(loadHousehold, null);
  const storedConfirmations = useStoredSessionValue(loadConfirmations, EMPTY_CONFIRMATIONS);
  const [fetchedHousehold, setFetchedHousehold] = useState<HouseholdResponse | null>(null);
  const [confirmationOverrides, setConfirmationOverrides] = useState<Confirmations>({});
  const data = fetchedHousehold ?? storedHousehold;
  const confirmations = fetchedHousehold ? confirmationOverrides : { ...storedConfirmations, ...confirmationOverrides };

  useEffect(() => {
    if (data ?? loadHousehold()) return;
    // Deep link for judges and the demo video: /household?epic=ZZK1400001 skips the OTP/consent screens.
    const epic = new URLSearchParams(window.location.search).get("epic");
    if (!epic) {
      router.replace("/");
      return;
    }
    fetch("/api/household", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ epic }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: HouseholdResponse | null) => {
        if (!j) {
          router.replace("/");
          return;
        }
        saveHousehold(j);
        setFetchedHousehold(j);
        setConfirmationOverrides({});
      })
      .catch(() => router.replace("/"));
  }, [data, router]);

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
    setConfirmationOverrides((c) => ({ ...c, [memberId]: serial }));
  }

  if (!data) {
    return (
      <Shell step={3}>
        <header className="mb-4 space-y-2" aria-hidden>
          <Skeleton className="h-3 w-56" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="h-4 w-64" />
        </header>
        <ListSkeleton count={4} label="Reading the roll for your house" />
      </Shell>
    );
  }

  const { household } = data;
  const summary = [
    counts.action && `${counts.action} need${counts.action === 1 ? "s" : ""} a claim`,
    counts.confirm && `${counts.confirm} to confirm`,
    counts.fresh && `${counts.fresh} new voter`,
    counts.correct && `${counts.correct} looks correct`,
    counts.fine && `${counts.fine} unchanged`,
  ].filter(Boolean).join(" · ");

  return (
    <Shell step={3} width="workspace">
      <PageHeader
        eyebrow={`AC 153 · Part ${household.partNo} · House ${household.houseNo}`}
        title="Your household on the draft roll"
        description={summary}
      >
        {!data.ai.available && (
          <p className="household-ai-note">AI unavailable on the server — identity matches use rule scores only.</p>
        )}
      </PageHeader>

      <HouseholdSummary
        total={assessments.length}
        action={counts.action}
        confirm={counts.confirm}
        fresh={counts.fresh}
        correct={counts.correct + counts.fine}
      />

      <ol className="member-record-grid">
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

      <ActionBar width="workspace">
        <PrimaryButton disabled={!firstActionable} onClick={() => firstActionable && router.push(`/member/${firstActionable.member.id}`)}>
          {counts.action + counts.fresh > 0 ? `Fix ${counts.action + counts.fresh} name${counts.action + counts.fresh === 1 ? "" : "s"}` : "Nothing to fix"}
        </PrimaryButton>
      </ActionBar>
    </Shell>
  );
}
