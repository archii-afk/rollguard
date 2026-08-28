"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { AiBanner } from "@/components/AiBanner";
import { LangTabs, type Lang } from "@/components/LangTabs";
import { FormPreview } from "@/components/FormPreview";
import { CLAIM_EVIDENCE, ClaimDecisionFields } from "@/components/ClaimDecisionFields";
import { PageHeader } from "@/components/PageHeader";
import { ListSkeleton } from "@/components/Skeleton";
import { loadHousehold, loadConfirmations, loadDraft, saveDraft } from "@/lib/client/session";
import { applyConfirmation } from "@/lib/client/applyConfirmation";
import { explainStatus, type MemberAssessment } from "@/lib/diff";
import type { Ground } from "@/lib/claims";
import { getClaimsApi, ClaimsApiError } from "@/lib/client/remoteClaims";
import type { DraftResponse, HouseholdResponse } from "@/lib/api/types";

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

  useEffect(() => {
    let current = true;
    queueMicrotask(() => {
      if (!current) return;
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
      const availableGrounds = explainStatus(resolved.status).groundOptions;
      setGround(availableGrounds[0] ?? null);
      const existing = loadDraft(id);
      if (existing) {
        setDraft(existing);
        setGround(existing.draft.fields.find((field) => field.key === "ground")?.value as Ground ?? availableGrounds[0] ?? null);
      }
    });
    return () => { current = false; };
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

  async function submit() {
    if (!a || !draft || !ground) return;
    setBusy(true);
    try {
      const api = await getClaimsApi(epic);
      const c = await api.create({ memberId: a.member.id, memberName: a.member.name.en, form: draft.draft.form, ground });
      router.push(`/claims?new=${encodeURIComponent(c.id)}`);
    } catch (err) {
      setError(
        err instanceof ClaimsApiError && err.code === "DEADLINE_MISSED"
          ? `The claims window has closed: ${err.message}`
          : "Could not submit the claim. Check your connection and try again.",
      );
      setBusy(false);
    }
  }

  if (!a || !data) {
    return (
      <Shell step={4} width="workspace">
        <ListSkeleton count={2} label="Preparing the claim" />
      </Shell>
    );
  }

  return (
    <Shell step={4} width="workspace">
      <PageHeader eyebrow={`Form ${a.suggestedForm ?? "6"} · ${a.member.name.en}`} title="Build the claim" description="Choose the reason and supporting evidence, then review the prepared form." />

      <div className="claim-workspace">
        <ClaimDecisionFields
          ground={ground}
          options={options}
          evidence={evidence}
          evidenceOptions={ground ? CLAIM_EVIDENCE[ground] : []}
          onGroundChange={(nextGround) => { setGround(nextGround); setDraft(null); setEvidence([]); }}
          onEvidenceChange={setEvidence}
        />

        <aside className="claim-preview" aria-label="Form preview">
          {draft ? (
            <div className="space-y-3">
              <AiBanner source={draft.source} model={draft.model} what="draft" />
              <LangTabs value={lang} onChange={setLang} />
              <FormPreview draft={draft.draft} lang={lang} />
              <p className="text-xs text-muted">Read it in your language. Submitting sends the English form; the declaration is kept in all three.</p>
            </div>
          ) : busy ? (
            <div className="rounded-md border border-violet/30 bg-violet-soft/50 px-4 py-3 text-sm" role="status" aria-live="polite">
              <p className="font-medium">Writing the declaration in English, Kannada and Hindi…</p>
              <p className="text-muted mt-1">Usually 15–25 seconds. It cites the exact roll rows you just saw.</p>
            </div>
          ) : (
            <p className="text-sm text-muted">The form is prefilled from the roll rows you saw, and the declaration is written in English, Kannada and Hindi.</p>
          )}

          {error && (
            <p role="alert" className="rounded-md border border-stamp/40 bg-stamp-soft px-3 py-2 text-sm">
              {error}
            </p>
          )}
        </aside>
      </div>

      <ActionBar width="workspace">
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
