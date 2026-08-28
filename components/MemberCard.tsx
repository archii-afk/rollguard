import { useEffect, useState } from "react";
import { StatusChip, Stamp } from "@/components/StatusChip";
import { AiBanner } from "@/components/AiBanner";
import type { MemberAssessment } from "@/lib/diff";
import type { MatchResponse } from "@/lib/api/types";

/**
 * A family member rendered as the roll entry it is: serial, photo box, name in
 * two scripts, relation, house, age. The draft roll's action is a stamp across it.
 */
export function MemberCard({
  assessment: a,
  epic,
  index,
  confirmation,
  onConfirm,
  onOpen,
}: {
  assessment: MemberAssessment;
  epic: string;
  index: number;
  confirmation: number | "none" | undefined;
  onConfirm: (memberId: string, serial: number | "none") => void;
  onOpen: () => void;
}) {
  const m = a.member;
  const serial = a.draft?.serial ?? a.previous?.serial;
  const actionable = !a.looksCorrect && a.status !== "RETAINED" && a.status !== "AMBIGUOUS_MATCH";
  const stampDelay = { animationDelay: `${120 + index * 90}ms` };

  return (
    <article className={`roll-paper relative rounded-sm border shadow-[0_2px_8px_rgba(0,0,0,0.06)] ${actionable ? "border-stamp/40" : "border-line"}`}>
      <button type="button" onClick={onOpen} className="block w-full text-left px-3 pt-2 pb-3 hover:bg-violet-soft/40 rounded-sm">
        <div className="flex items-start justify-between font-mono text-[11px] text-muted">
          <span>{serial ? `Sl. ${serial}` : "not enumerated"} · {m.epic ?? "no EPIC yet"}</span>
          <span className="capitalize">{m.relationToHead}</span>
        </div>
        <div className="mt-1 flex gap-3">
          <div className="h-12 w-10 shrink-0 border border-line bg-paper" aria-hidden />
          <div className="min-w-0 text-sm leading-snug">
            <div className="font-semibold text-[16px]">{m.name.en}</div>
            <div className="lang-kn text-muted">{m.name.kn}</div>
            <div className="text-muted">
              House {a.previous?.houseNo ?? "14"} · Age {m.age} · {m.gender}
            </div>
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusChip status={a.status} looksCorrect={a.looksCorrect} />
          {actionable && <span className="text-xs text-violet font-medium">Fix this →</span>}
        </div>
        {a.looksCorrect ? (
          <p className="mt-1 text-sm text-muted">{m.name.en.split(" ")[0]} has moved and asked to shift — this deletion looks correct. No action.</p>
        ) : (
          a.status !== "AMBIGUOUS_MATCH" && <p className="mt-1 text-sm text-ink/85">{a.reason}</p>
        )}
        {!a.looksCorrect && (
          <div className="absolute right-3 top-7" style={stampDelay}>
            <Stamp status={a.status} />
          </div>
        )}
      </button>

      {a.status === "AMBIGUOUS_MATCH" && confirmation === undefined && (
        <MatchConfirm assessment={a} epic={epic} onConfirm={(serial) => onConfirm(m.id, serial)} />
      )}
    </article>
  );
}

function MatchConfirm({ assessment: a, epic, onConfirm }: { assessment: MemberAssessment; epic: string; onConfirm: (s: number | "none") => void }) {
  const [rank, setRank] = useState<MatchResponse | null>(null);
  const top = a.candidates[0];

  useEffect(() => {
    let live = true;
    fetch("/api/match", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ epic, memberId: a.member.id }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: MatchResponse | null) => live && j && setRank(j))
      .catch(() => {});
    return () => { live = false; };
  }, [a.member.id, epic]);

  const r = rank?.rankings.find((x) => x.candidateSerial === top.entry.serial);
  const probability = r?.sameProbability ?? Math.min(0.95, top.score + 0.2);
  const reasons = (r?.reasons ?? top.rules).map(humanRule);

  return (
    <div className="border-t border-dashed border-line bg-violet-soft/50 px-3 py-3 space-y-2">
      <p className="text-sm">
        <span className="font-semibold">{a.member.name.en}</span> is not on the draft roll under this EPIC. A similar entry exists:
      </p>
      <div className="rounded-sm border border-line bg-card px-3 py-2 text-sm">
        <div className="font-semibold">{top.entry.name.en} <span className="lang-kn text-muted font-normal">{top.entry.name.kn}</span></div>
        <div className="text-muted font-mono text-xs">
          Sl. {top.entry.serial} · {top.entry.epic} · House {top.entry.houseNo} · Age {top.entry.age}
          {top.entry.flag && <span className="text-stamp"> · flag {top.entry.flag}</span>}
        </div>
      </div>
      <div className="text-sm">
        <span className="font-medium">Same person? {Math.round(probability * 100)}% likely.</span>
        <ul className="mt-1 list-disc pl-5 text-ink/80">
          {reasons.slice(0, 3).map((x, i) => <li key={i}>{x}</li>)}
        </ul>
      </div>
      <AiBanner source={rank ? rank.source : "fallback"} model={rank?.model} what="match" />
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={() => onConfirm(top.entry.serial)} className="min-h-[44px] flex-1 rounded-md bg-violet px-3 font-display font-semibold text-white">
          Yes, that’s {a.member.name.en.split(" ")[0]}
        </button>
        <button type="button" onClick={() => onConfirm("none")} className="min-h-[44px] rounded-md border border-ink/30 bg-card px-3 font-display font-semibold">
          No
        </button>
      </div>
    </div>
  );
}

function humanRule(r: string) {
  return (
    {
      "same-house": "Same house number",
      "name-close": "Names are close after expanding Md. → Mohammed",
      "name-similar": "Names are similar",
      "age-consistent": "Age is one year on from the previous roll",
      "relation-match": "Same father’s / husband’s name",
      "gender-match": "Same gender",
    } as Record<string, string>
  )[r] ?? r;
}
