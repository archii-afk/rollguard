"use client";

import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { StatusChip } from "@/components/StatusChip";
import { PageHeader } from "@/components/PageHeader";
import { ProvenanceCard } from "@/components/ProvenanceCard";
import { ListSkeleton } from "@/components/Skeleton";
import { loadHousehold, loadConfirmations } from "@/lib/client/session";
import { applyConfirmation } from "@/lib/client/applyConfirmation";
import { explainStatus, type MemberAssessment } from "@/lib/diff";
import type { HouseholdResponse } from "@/lib/api/types";

const EMPTY_CONFIRMATIONS: Record<string, number | "none"> = {};

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

export default function MemberDetail() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const data = useStoredSessionValue(loadHousehold, null);
  const confirmations = useStoredSessionValue(loadConfirmations, EMPTY_CONFIRMATIONS);

  useEffect(() => {
    const h = data ?? loadHousehold();
    if (!h) {
      router.replace("/");
      return;
    }
    const raw = h.assessments.find((x) => x.member.id === id);
    if (!raw) {
      router.replace("/household");
      return;
    }
  }, [data, id, router]);

  const a = useMemo<MemberAssessment | null>(() => {
    if (!data) return null;
    const raw = data.assessments.find((x) => x.member.id === id);
    return raw ? applyConfirmation(raw, confirmations[id]) : null;
  }, [confirmations, data, id]);

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
    <Shell step={4} width="workspace">
      <PageHeader
        eyebrow={`${a.member.relationToHead} · House ${data.household.houseNo} · Part ${data.household.partNo}`}
        title={<>{a.member.name.en} <span className="lang-kn text-muted font-normal text-xl">{a.member.name.kn}</span></>}
        meta={<StatusChip status={a.status} looksCorrect={a.looksCorrect} />}
      />

      <div className="member-detail-grid">
        <div className="member-detail-decision">
          <section>
            <h2>What went wrong</h2>
            <p>
              {a.looksCorrect
                ? `${a.member.name.en.split(" ")[0]} asked to be shifted to another constituency, and the draft roll records exactly that. Contesting it would be wrong — and would slow down the claims that matter.`
                : explain.reason}
            </p>
          </section>

          {!nothingToDo && (
            <section className="member-detail-law">
              <h2>What the law requires</h2>
              <p>{explain.lawRequires}</p>
            </section>
          )}

          {needsConfirm && (
            <p className="member-detail-confirmation">
              A similar entry exists on the draft roll. Go back to the family board and confirm whether it is {a.member.name.en.split(" ")[0]} before drafting a claim.
            </p>
          )}
        </div>
        <aside aria-label="Source evidence">
          <ProvenanceCard items={a.provenance} />
        </aside>
      </div>

      <ActionBar width="workspace">
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
