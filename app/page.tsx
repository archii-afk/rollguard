"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shell } from "@/components/Shell";
import { Countdown } from "@/components/Countdown";
import { Icon, type IconName } from "@/components/Icon";
import { EntryDocket } from "@/components/EntryDocket";
import { saveHousehold, clearJourney } from "@/lib/client/session";
import type { HouseholdResponse, ApiError } from "@/lib/api/types";

const DEMO_EPIC = "ZZK1400001";
const CLAIM_WINDOW_END = "2026-09-23";

const BENEFITS: { icon: IconName; text: string }[] = [
  { icon: "home", text: "Everyone at your house checked from one EPIC number" },
  { icon: "info", text: "Why each name was flagged, with the exact roll row" },
  { icon: "paper", text: "Form 6 or 8 drafted in your language, then tracked to the end" },
];

export default function Landing() {
  const router = useRouter();
  const [epic, setEpic] = useState("");
  const [stage, setStage] = useState<"epic" | "otp">("epic");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <Shell step={1} width="workspace">
      <div className="landing-ledger-grid">
        <section className="landing-story">
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

          <div className="landing-source-slip"><SampleEntry /></div>

          <ul className="mt-5 grid gap-2" aria-label="What RollGuard does">
            {BENEFITS.map((b) => (
              <li key={b.text} className="flex items-start gap-2.5 text-[15px]">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-soft text-violet">
                  <Icon name={b.icon} size={14} />
                </span>
                <span>{b.text}</span>
              </li>
            ))}
          </ul>
        </section>
        <EntryDocket
          stage={stage}
          epic={epic}
          otp={otp}
          error={error}
          busy={busy}
          onEpicChange={setEpic}
          onOtpChange={setOtp}
          onUseDemo={() => setEpic(DEMO_EPIC)}
          onSendOtp={() => { setError(null); setStage("otp"); }}
          onEditEpic={() => { setStage("epic"); setOtp(""); }}
          onVerify={verify}
        />
      </div>
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
