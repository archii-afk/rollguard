"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useParams, useRouter } from "next/navigation";
import { Shell, ActionBar, PrimaryButton, SecondaryButton } from "@/components/Shell";
import { AiBanner } from "@/components/AiBanner";
import { LangTabs, tabIdForLanguage, type Lang } from "@/components/LangTabs";
import { FormPreview } from "@/components/FormPreview";
import { CLAIM_EVIDENCE, ClaimDecisionFields } from "@/components/ClaimDecisionFields";
import { PageHeader } from "@/components/PageHeader";
import { ListSkeleton } from "@/components/Skeleton";
import { loadHousehold, loadConfirmations, loadDraft, saveDraft } from "@/lib/client/session";
import { applyConfirmation } from "@/lib/client/applyConfirmation";
import { explainStatus, type MemberAssessment } from "@/lib/diff";
import type { Ground } from "@/lib/claims";
import { getClaimsApi, ClaimsApiError } from "@/lib/client/remoteClaims";
import type { DraftResponse } from "@/lib/api/types";

const EMPTY_CONFIRMATIONS: Record<string, number | "none"> = {};

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

export function deriveClaimWorkspaceInitialState<T extends { draft: { fields: { key: string; value: string }[] } }>(groundOptions: readonly Ground[], savedDraft: T | null) {
  const savedGround = savedDraft?.draft.fields.find((field) => field.key === "ground")?.value as Ground | undefined;
  return {
    ground: savedGround ?? groundOptions[0] ?? null,
    evidence: [] as string[],
    draft: savedDraft,
  };
}

export default function ClaimDraftPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const data = useStoredSessionValue(loadHousehold, null);
  const confirmations = useStoredSessionValue(loadConfirmations, EMPTY_CONFIRMATIONS);
  const savedDraft = useStoredSessionValue(useCallback(() => loadDraft(id), [id]), null);

  useEffect(() => {
    const household = data ?? loadHousehold();
    if (!household) {
      router.replace("/");
      return;
    }
    if (!household.assessments.some((assessment) => assessment.member.id === id)) router.replace("/household");
  }, [data, id, router]);

  const assessment = useMemo<MemberAssessment | null>(() => {
    const raw = data?.assessments.find((item) => item.member.id === id);
    return raw ? applyConfirmation(raw, confirmations[id]) : null;
  }, [confirmations, data, id]);
  const epic = data?.household.members.find((member) => member.epic)?.epic ?? "";

  if (!data || !assessment) {
    return (
      <Shell step={4} width="workspace">
        <ListSkeleton count={2} label="Preparing the claim" />
      </Shell>
    );
  }

  return <ClaimWorkspace key={`${id}:${savedDraft ? "saved" : "new"}`} id={id} epic={epic} assessment={assessment} savedDraft={savedDraft} />;
}

function ClaimWorkspace({
  id,
  epic,
  assessment,
  savedDraft,
}: {
  id: string;
  epic: string;
  assessment: MemberAssessment;
  savedDraft: DraftResponse | null;
}) {
  const router = useRouter();
  const options = useMemo(() => explainStatus(assessment.status).groundOptions, [assessment]);
  const [workspace, setWorkspace] = useState(() => deriveClaimWorkspaceInitialState(options, savedDraft));
  const [lang, setLang] = useState<Lang>("en");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ground, evidence, draft } = workspace;
  const formPanelId = `claim-${id}-form-panel`;

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
      const nextDraft = (await res.json()) as DraftResponse;
      setWorkspace((current) => ({ ...current, draft: nextDraft }));
      saveDraft(id, nextDraft);
    } catch {
      setError("Network problem while drafting. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit() {
    if (!draft || !ground) return;
    setBusy(true);
    try {
      const api = await getClaimsApi(epic);
      const claim = await api.create({ memberId: assessment.member.id, memberName: assessment.member.name.en, form: draft.draft.form, ground });
      router.push(`/claims?new=${encodeURIComponent(claim.id)}`);
    } catch (err) {
      setError(
        err instanceof ClaimsApiError && err.code === "DEADLINE_MISSED"
          ? `The claims window has closed: ${err.message}`
          : "Could not submit the claim. Check your connection and try again.",
      );
      setBusy(false);
    }
  }

  return (
    <Shell step={4} width="workspace">
      <PageHeader eyebrow={`Form ${assessment.suggestedForm ?? "6"} · ${assessment.member.name.en}`} title="Build the claim" description="Choose the reason and supporting evidence, then review the prepared form." />

      <div className="claim-workspace">
        <ClaimDecisionFields
          ground={ground}
          options={options}
          evidence={evidence}
          evidenceOptions={ground ? CLAIM_EVIDENCE[ground] : []}
          onGroundChange={(nextGround) => setWorkspace({ ground: nextGround, evidence: [], draft: null })}
          onEvidenceChange={(nextEvidence) => setWorkspace((current) => ({ ...current, evidence: nextEvidence }))}
        />

        <aside className="claim-preview" aria-label="Form preview">
          {draft ? (
            <div className="space-y-3">
              <AiBanner source={draft.source} model={draft.model} what="draft" />
              <LangTabs value={lang} panelId={formPanelId} label="Form language" onChange={setLang} />
              <FormPreview draft={draft.draft} lang={lang} panelId={formPanelId} tabId={tabIdForLanguage(formPanelId, lang)} />
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
