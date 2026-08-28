"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Shell, ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { ClaimCard } from "@/components/ClaimCard";
import { MockBadge } from "@/components/MockBadge";
import { LocalStorageClaimStore, transition, DeadlineMissed, InvalidTransition, type Claim, type ClaimEvent } from "@/lib/claims";
import { seedDemoClaims } from "@/lib/client/seedDemoClaims";
import { loadHousehold } from "@/lib/client/session";

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
  const store = useMemo(() => new LocalStorageClaimStore(), []);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [seeded, setSeeded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const hasHousehold = typeof window !== "undefined" && !!loadHousehold();

  useEffect(() => {
    setSeeded(seedDemoClaims(store));
    setClaims(store.list());
  }, [store]);

  function onEvent(id: string, e: ClaimEvent) {
    const c = store.get(id);
    if (!c) return;
    try {
      const next = transition(c, e, new Date());
      store.save(next);
      setClaims(store.list());
      setErrors((x) => ({ ...x, [id]: "" }));
    } catch (err) {
      const msg =
        err instanceof DeadlineMissed ? `Too late: ${err.message}`
        : err instanceof InvalidTransition ? `That step is not possible from here: ${err.message}`
        : "Something went wrong applying that step.";
      setErrors((x) => ({ ...x, [id]: msg }));
    }
  }

  function reset() {
    store.clear();
    setSeeded(seedDemoClaims(store));
    setClaims(store.list());
  }

  const ordered = [...claims].sort((a, b) => (a.id === newId ? -1 : b.id === newId ? 1 : 0));

  return (
    <Shell step={5}>
      <header className="mb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Claims · SIR 2026</p>
        <h1 className="font-display font-bold text-[30px] leading-tight tracking-tight mt-1">Where each claim stands</h1>
        <p className="mt-1 text-[15px] text-ink/85">
          A claim moves through the BLO, the ERO and — if rejected — the DEO. Each step here would arrive as an SMS.
        </p>
        {seeded && (
          <p className="mt-2 text-xs text-muted">
            <MockBadge label="demo" /> Two claims were pre-loaded so the tracker is never empty.
          </p>
        )}
      </header>

      {ordered.length === 0 ? (
        <p className="rounded-md border border-line bg-card px-4 py-6 text-center text-sm text-muted">
          No claims yet. Start from your family board.
        </p>
      ) : (
        <div className="space-y-4">
          {ordered.map((c) => (
            <ClaimCard key={c.id} claim={c} isNew={c.id === newId} onEvent={onEvent} error={errors[c.id]} />
          ))}
        </div>
      )}

      <p className="mt-6 text-xs text-muted">
        <button type="button" onClick={reset} className="underline underline-offset-2">Reset demo claims</button>
        {" · "}Claims live in this phone’s browser storage; production would keep them server-side against the ECINET ack number.
      </p>

      <ActionBar>
        <SecondaryButton onClick={() => router.push(hasHousehold ? "/household" : "/")}>
          {hasHousehold ? "Back to family" : "Start over"}
        </SecondaryButton>
        <PrimaryButton onClick={() => router.push("/about")}>What is real here?</PrimaryButton>
      </ActionBar>
    </Shell>
  );
}
