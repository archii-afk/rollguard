"use client";

import { Suspense, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell, ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { ClaimCard } from "@/components/ClaimCard";
import { MockBadge } from "@/components/MockBadge";
import { ListSkeleton } from "@/components/Skeleton";
import type { Claim, ClaimEvent } from "@/lib/claims";
import { getClaimsApi, ClaimsApiError, type ClaimsApi } from "@/lib/client/remoteClaims";
import { loadHousehold } from "@/lib/client/session";
import type { HouseholdResponse } from "@/lib/api/types";

const DEMO_EPIC = "ZZK1400001";

function subscribeToSession() {
  return () => {};
}

function useStoredSessionValue<T>(read: () => T, serverValue: T) {
  const value = useRef<{ read: () => T; snapshot: T } | undefined>(undefined);
  const getSnapshot = useCallback(() => {
    if (!value.current || value.current.read !== read) value.current = { read, snapshot: read() };
    return value.current.snapshot;
  }, [read]);
  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);

  return useSyncExternalStore(subscribeToSession, getSnapshot, getServerSnapshot);
}

export function deriveClaimsInitialState(household: HouseholdResponse | null) {
  return {
    epic: household?.household.members.find((member) => member.epic)?.epic ?? DEMO_EPIC,
    hasHousehold: !!household,
  };
}

export default function ClaimsPage() {
  return (
    <Suspense fallback={<Shell step={5} />}>
      <ClaimsInner />
    </Suspense>
  );
}

function ClaimsInner() {
  const router = useRouter();
  const params = useSearchParams();
  const newId = params.get("new");
  const [api, setApi] = useState<ClaimsApi | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const household = useStoredSessionValue<HouseholdResponse | null | undefined>(loadHousehold, undefined);
  const { epic, hasHousehold } = deriveClaimsInitialState(household ?? null);

  useEffect(() => {
    // Claims are scoped to the household the citizen logged in with; judges who deep-link get the demo house.
    if (household === undefined) return;
    let live = true;
    getClaimsApi(epic)
      .then(async (a) => {
        const list = await a.list();
        if (!live) return;
        setApi(a);
        setClaims(list);
      })
      .catch(() => live && setLoadError("Could not load claims. Check your connection and reload."));
    return () => { live = false; };
  }, [epic, household]);

  async function onEvent(id: string, e: ClaimEvent) {
    if (!api) return;
    const c = claims.find((x) => x.id === id);
    if (!c) return;
    try {
      const next = await api.apply(c, e);
      setClaims((xs) => xs.map((x) => (x.id === id ? next : x)));
      setErrors((x) => ({ ...x, [id]: "" }));
    } catch (err) {
      const msg =
        err instanceof ClaimsApiError && err.code === "DEADLINE_MISSED" ? `Too late: ${err.message}`
        : err instanceof ClaimsApiError && err.code === "INVALID_TRANSITION" ? `That step is not possible from here: ${err.message}`
        : err instanceof ClaimsApiError && err.code === "STATE_CONFLICT" ? "This claim changed in another tab. Reloading it."
        : "Something went wrong applying that step.";
      setErrors((x) => ({ ...x, [id]: msg }));
      if (err instanceof ClaimsApiError && err.code === "STATE_CONFLICT") setClaims(await api.list());
    }
  }

  async function reset() {
    if (!api) return;
    setClaims(await api.reset());
    setErrors({});
  }

  const ordered = [...claims].sort((a, b) => (a.id === newId ? -1 : b.id === newId ? 1 : 0));
  // Demo claims are the ones "filed" on the fixed seed date (see lib/client/seedDemoClaims.ts).
  const seeded = claims.some((c) => (c.submittedAt ?? "").startsWith("2026-08-26"));

  return (
    <Shell step={5} width="workspace">
      <header className="mb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Claims · SIR 2026</p>
        <h1 className="font-display font-bold text-[30px] leading-tight tracking-tight mt-1">Where each claim stands</h1>
        <p className="mt-1 text-[15px] text-ink/85">
          A claim moves through the BLO, the ERO and — if rejected — the DEO. Each step here would arrive as an SMS.
        </p>
        {api && seeded && (
          <p className="mt-2 text-xs text-muted">
            <MockBadge label="demo" /> Two claims are pre-loaded so the tracker is never empty.
          </p>
        )}
      </header>

      {loadError ? (
        <p role="alert" className="rounded-md border border-stamp/40 bg-stamp-soft px-3 py-2 text-sm">{loadError}</p>
      ) : !api ? (
        <ListSkeleton count={2} label="Loading your claims" />
      ) : ordered.length === 0 ? (
        <p className="rounded-md border border-line bg-card px-4 py-6 text-center text-sm text-muted">No claims yet. Start from your family board.</p>
      ) : (
        <div className="space-y-4">
          {ordered.map((c) => (
            <ClaimCard key={c.id} claim={c} isNew={c.id === newId} onEvent={onEvent} error={errors[c.id]} />
          ))}
        </div>
      )}

      {api && (
        <p className="mt-6 text-xs text-muted">
          <button type="button" onClick={reset} className="underline underline-offset-2">Reset demo claims</button>
          {" · "}
          {api.persistence === "postgres"
            ? "Claims are stored server-side in Postgres, keyed by your household's EPIC — open this page on another device and they are still here."
            : "No database is configured on this deployment, so claims live in this browser's storage."}
        </p>
      )}

      <ActionBar>
        <SecondaryButton onClick={() => router.push(hasHousehold ? "/household" : "/")}>
          {hasHousehold ? "Back to family" : "Start over"}
        </SecondaryButton>
        <PrimaryButton onClick={() => router.push("/about")}>What is real here?</PrimaryButton>
      </ActionBar>
    </Shell>
  );
}
