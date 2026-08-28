"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { MockBadge } from "@/components/MockBadge";
import { AiBanner } from "@/components/AiBanner";
import { LangTabs, type Lang } from "@/components/LangTabs";
import { FormPreview } from "@/components/FormPreview";
import { loadHousehold, loadConfirmations, loadDraft, saveDraft } from "@/lib/client/session";
import { applyConfirmation } from "@/lib/client/applyConfirmation";
import { explainStatus, type MemberAssessment } from "@/lib/diff";
import { createClaim, transition, LocalStorageClaimStore, DeadlineMissed, type Ground } from "@/lib/claims";
import type { DraftResponse, HouseholdResponse } from "@/lib/api/types";

const GROUNDS: Record<Ground, { title: string; detail: string }> = {
  ALIVE_RESIDENT: { title: "They are alive and live here", detail: "The roll is wrong about the person, not about the address." },
  NEVER_SHIFTED: { title: "They never moved away", detail: "Still ordinarily resident at this house; the BLO could not find them at home." },
  RESIDENT_WAS_AWAY: { title: "They live here but were away", detail: "Work, study or hospital — temporarily absent, not shifted." },
  NOT_DUPLICATE: { title: "It is the same person, entered twice", detail: "One entry with a spelling variant should be corrected, not deleted." },
  TURNED_18: { title: "They turned 18 and are not enrolled yet", detail: "First-time inclusion for a new voter in this house." },
  CORRECT_DETAILS: { title: "Correct the details on the entry", detail: "Name, age, relation or house number is wrong on the draft roll." },
};

const EVIDENCE: Record<Ground, string[]> = {
  ALIVE_RESIDENT: ["Any photo ID (Aadhaar masked, ration card, bank passbook)", "Recent utility bill or rent agreement for this house", "Elector will appear before the BLO or ERO in person"],
  NEVER_SHIFTED: ["Any photo ID with this address", "Recent utility bill or rent agreement", "Neighbour or RWA letter confirming residence"],
  RESIDENT_WAS_AWAY: ["Any photo ID with this address", "Proof of temporary absence (employer letter, hospital record)"],
  NOT_DUPLICATE: ["Photo ID showing the correct spelling", "Previous roll extract with the original serial", "Birth certificate or school record showing date of birth"],
  TURNED_18: ["Proof of date of birth (birth certificate, Class 10 marksheet)", "Proof of residence at this house", "Passport-size photograph"],
  CORRECT_DETAILS: ["Photo ID showing the correct details", "Any document supporting the corrected field"],
};

export default function ClaimDraftPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<HouseholdResponse | null>(null);
  const [a, setA] = useState<MemberAssessment | null>(null);
  const [ground, setGround] = useState<Ground | null>(null);
  const [evidence, setEvidence] = useState<string[]>([]);
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const store = useMemo(() => new LocalStorageClaimStore(), []);

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
    const resolved = applyConfirmation(raw, loadConfirmations()[id]);
    setData(h);
    setA(resolved);
    const options = explainStatus(resolved.status).groundOptions;
    setGround(options[0] ?? null);
    const existing = loadDraft(id);
    if (existing) {
      setDraft(existing);
      setGround(existing.draft.fields.find((f) => f.key === "ground")?.value as Ground ?? options[0] ?? null);
    }
  }, [id, router]);

  const options = useMemo(() => (a ? explainStatus(a.status).groundOptions : []), [a]);
  const epic = data?.household.members.find((m) => m.epic)?.epic ?? "";

  async function draftWithAi() {
    if (!ground) return;
    setBusy(true);
    setError(null);
    try {
      const confirmations = loadConfirmations();
      const candidateSerial = typeof confirmations[id] === "number" ? confirmations[id] : undefined;
      const res = await fetch("/api/draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ epic, memberId: id, ground, evidence, candidateSerial }),
      });
      if (!res.ok) {
        setError("Could not draft the form right now. Try again.");
        return;
      }
      const j = (await res.json()) as DraftResponse;
      setDraft(j);
      saveDraft(id, j);
    } catch {
      setError("Network problem while drafting. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function submit() {
    if (!a || !draft || !ground) return;
    try {
      const now = new Date();
      const c = transition(createClaim({ memberId: a.member.id, memberName: a.member.name.en, form: draft.draft.form, ground }, now), { type: "SUBMIT" }, now);
      store.save(c);
      router.push(`/claims?new=${c.id}`);
    } catch (err) {
      setError(err instanceof DeadlineMissed ? `The claims window has closed: ${err.message}` : "Could not submit the claim.");
    }
  }

  if (!a || !data) return <Shell step={4} />;

  return (
    <Shell step={4}>
      <header className="mb-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">Form {a.suggestedForm ?? "6"} · {a.member.name.en}</p>
        <h1 className="font-display font-bold text-[30px] leading-tight tracking-tight mt-1">Draft the claim</h1>
      </header>

      <section className="mb-5">
        <h2 className="text-sm font-medium mb-2">Why is the draft roll wrong?</h2>
        <div className="grid gap-2">
          {options.map((g) => (
            <label key={g} className={`flex gap-3 rounded-md border bg-card px-3 py-3 cursor-pointer ${ground === g ? "border-violet ring-2 ring-violet/20" : "border-line"}`}>
              <input type="radio" name="ground" className="mt-1 accent-violet" checked={ground === g} onChange={() => { setGround(g); setDraft(null); setEvidence([]); }} />
              <span>
                <span className="block font-medium">{GROUNDS[g].title}</span>
                <span className="block text-sm text-muted">{GROUNDS[g].detail}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      {ground && (
        <section className="mb-5">
          <h2 className="text-sm font-medium mb-2 flex items-center gap-2">
            Evidence you can attach <MockBadge label="placeholder · nothing is uploaded" />
          </h2>
          <div className="grid gap-2">
            {EVIDENCE[ground].map((e) => {
              const on = evidence.includes(e);
              return (
                <label key={e} className={`flex gap-3 rounded-md border bg-card px-3 py-3 cursor-pointer text-sm ${on ? "border-violet" : "border-line"}`}>
                  <input type="checkbox" className="mt-0.5 accent-violet" checked={on} onChange={() => setEvidence((x) => (on ? x.filter((y) => y !== e) : [...x, e]))} />
                  <span>{e}</span>
                </label>
              );
            })}
          </div>
        </section>
      )}

      {draft ? (
        <section className="mb-5 space-y-3">
          <AiBanner source={draft.source} model={draft.model} what="draft" />
          <LangTabs value={lang} onChange={setLang} />
          <FormPreview draft={draft.draft} lang={lang} />
          <p className="text-xs text-muted">Read it in your language. Submitting sends the English form; the declaration is kept in all three.</p>
        </section>
      ) : (
        <p className="mb-5 text-sm text-muted">The form is prefilled from the roll rows you saw, and the declaration is written in English, Kannada and Hindi.</p>
      )}

      {error && (
        <p role="alert" className="mb-5 rounded-md border border-stamp/40 bg-stamp-soft px-3 py-2 text-sm">
          {error}
        </p>
      )}

      <ActionBar>
        <SecondaryButton onClick={() => router.push(`/member/${id}`)}>Back</SecondaryButton>
        {draft ? (
          <PrimaryButton onClick={submit}>Submit claim</PrimaryButton>
        ) : (
          <PrimaryButton disabled={!ground || busy} onClick={draftWithAi}>
            {busy ? "Drafting…" : "Draft with AI"}
          </PrimaryButton>
        )}
      </ActionBar>
    </Shell>
  );
}
