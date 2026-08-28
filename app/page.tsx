"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton } from "@/components/Shell";
import { MockBadge } from "@/components/MockBadge";
import { Countdown } from "@/components/Countdown";
import { saveHousehold, clearJourney } from "@/lib/client/session";
import type { HouseholdResponse, ApiError } from "@/lib/api/types";

const DEMO_EPIC = "ZZK1400001";
const CLAIM_WINDOW_END = "2026-09-23";

export default function Landing() {
  const router = useRouter();
  const [epic, setEpic] = useState("");
  const [stage, setStage] = useState<"epic" | "otp">("epic");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const epicOk = /^ZZK\d{7}$/.test(epic);
  const otpOk = /^\d{6}$/.test(otp);

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/household", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ epic }),
      });
      if (res.status === 404) {
        setError(`No household found for ${epic} in Part 112. Try the demo EPIC ${DEMO_EPIC}.`);
        setStage("epic");
        return;
      }
      if (!res.ok) {
        const e = (await res.json().catch(() => null)) as ApiError | null;
        setError(e?.message ?? "Could not read the roll right now. Try again.");
        return;
      }
      const data = (await res.json()) as HouseholdResponse;
      clearJourney();
      saveHousehold(data);
      router.push("/consent");
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell step={1}>
      {/* Hero: the artifact itself — a roll entry with the stamp that starts the problem */}
      <section className="mb-6">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted mb-2">SIR 2026 · draft roll published 24 Aug</p>
        <h1 className="font-display font-bold text-[34px] leading-[1.05] tracking-tight">
          Is your family still on the voter list?
        </h1>
        <p className="mt-3 text-[15px] text-ink/85">
          The draft roll marked <span className="font-semibold">1.07 crore names</span> in Karnataka as absent, shifted, dead or duplicate.
          Check every name in your house in one go, and get the wrong ones back before the window closes.
        </p>
        <div className="mt-3">
          <Countdown until={CLAIM_WINDOW_END} />
        </div>
      </section>

      <SampleEntry />

      <section className="mt-6 space-y-4" aria-live="polite">
        <label className="block">
          <span className="text-sm font-medium">Any one EPIC number from your house</span>
          <input
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            value={epic}
            disabled={stage === "otp"}
            onChange={(e) => setEpic(e.target.value.toUpperCase().replace(/\s/g, ""))}
            placeholder="ZZK1234567"
            className="mt-1 w-full min-h-[52px] rounded-md border border-ink/30 bg-card px-3 font-mono text-xl tracking-[0.12em] placeholder:text-muted/60 disabled:bg-paper"
          />
          <span className="mt-1 block text-xs text-muted">
            We find everyone enrolled at the same house.{" "}
            <button type="button" className="underline underline-offset-2 text-violet" onClick={() => setEpic(DEMO_EPIC)}>
              Use demo EPIC {DEMO_EPIC}
            </button>
          </span>
        </label>

        {stage === "otp" && (
          <label className="block">
            <span className="text-sm font-medium flex items-center gap-2">
              OTP sent to the mobile linked to this EPIC <MockBadge label="mock · any 6 digits" />
            </span>
            <input
              inputMode="numeric"
              autoFocus
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="••••••"
              className="mt-1 w-full min-h-[52px] rounded-md border border-ink/30 bg-card px-3 font-mono text-2xl tracking-[0.4em]"
            />
          </label>
        )}

        {error && (
          <p role="alert" className="rounded-md border border-stamp/40 bg-stamp-soft px-3 py-2 text-sm">
            {error}
          </p>
        )}
      </section>

      <ActionBar>
        {stage === "epic" ? (
          <PrimaryButton disabled={!epicOk} onClick={() => { setError(null); setStage("otp"); }}>
            Send OTP
          </PrimaryButton>
        ) : (
          <PrimaryButton disabled={!otpOk || busy} onClick={verify}>
            {busy ? "Reading the roll…" : "Check my family"}
          </PrimaryButton>
        )}
      </ActionBar>
    </Shell>
  );
}

/** A single stamped roll entry: the whole problem in one glance. */
function SampleEntry() {
  return (
    <figure className="roll-paper relative rounded-sm border border-line px-3 pt-2 pb-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between font-mono text-[11px] text-muted">
        <span>Sl. 143 · ZZK1400002</span>
        <span>Part 112</span>
      </div>
      <div className="mt-1 flex gap-3">
        <div className="h-12 w-10 shrink-0 border border-line bg-paper" aria-hidden />
        <div className="text-sm leading-snug">
          <div className="font-semibold">Ameena Begum</div>
          <div className="text-muted">Husband’s name: Abdul Rasheed</div>
          <div className="text-muted">House 14 · Age 73 · F</div>
        </div>
      </div>
      <span
        aria-hidden
        className="absolute right-3 top-6 -rotate-6 border-[3px] border-stamp text-stamp rounded-[3px] px-2 py-1 font-display font-bold uppercase tracking-[0.18em] text-[13px] leading-none opacity-85 mix-blend-multiply"
      >
        Deceased · D
      </span>
      <figcaption className="mt-2 text-xs text-muted">Ameena is 73, alive, and has lived at House 14 for forty years.</figcaption>
    </figure>
  );
}
