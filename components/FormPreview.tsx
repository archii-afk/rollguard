import type { DraftOutput, DraftField } from "@/lib/draft";
import type { Lang } from "./LangTabs";

const LANG_CLASS: Record<Lang, string> = { en: "", kn: "lang-kn", hi: "lang-hi" };
const FORM_TITLE = { "6": "Form 6 — Application for inclusion of name", "8": "Form 8 — Application for correction of entries" } as const;

/** Ground codes are for the state machine; the paper form shows the citizen's words. */
const GROUND_LABEL: Record<string, string> = {
  ALIVE_RESIDENT: "Alive and ordinarily resident at this address",
  NEVER_SHIFTED: "Never shifted from this address",
  RESIDENT_WAS_AWAY: "Resident here; temporarily away",
  NOT_DUPLICATE: "Same person entered twice — not a duplicate elector",
  TURNED_18: "Attained 18 years; first inclusion",
  CORRECT_DETAILS: "Correction of entry details",
};
const fieldValue = (f: DraftField) => (f.key === "ground" ? GROUND_LABEL[f.value] ?? f.value : f.value);

/** The filled form, styled as the paper sheet the ERO's office actually handles. */
export function FormPreview({ draft, lang }: { draft: DraftOutput; lang: Lang }) {
  return (
    <article className="roll-paper rounded-sm border border-line shadow-[0_2px_8px_rgba(0,0,0,0.06)] px-4 pt-4 pb-5">
      <header className="flex items-start justify-between gap-3 border-b-2 border-ink pb-2 mb-3">
        <div>
          <div className="font-display font-bold text-2xl leading-none">FORM {draft.form}</div>
          <div className="text-xs text-muted mt-1">{FORM_TITLE[draft.form]}</div>
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted text-right">
          Prefilled
          <br />
          SIR 2026 claim
        </div>
      </header>
      <table className="w-full text-sm">
        <tbody>
          {draft.fields.map((f) => (
            <tr key={f.key} className="align-top">
              <th scope="row" className="w-[38%] py-1 pr-2 text-left font-normal text-muted">
                {f.label}
              </th>
              <td className="py-1 font-medium break-words">{fieldValue(f) || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h4 className="mt-4 mb-1 text-[11px] font-mono uppercase tracking-wider text-muted">Declaration</h4>
      <p className={`text-[15px] leading-relaxed ${LANG_CLASS[lang]}`}>{draft.declaration[lang]}</p>
      <h4 className="mt-4 mb-1 text-[11px] font-mono uppercase tracking-wider text-muted">Attach</h4>
      <ul className="list-disc pl-5 text-sm space-y-0.5">
        {draft.evidenceChecklist.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
      <div className="mt-6 flex justify-between text-xs text-muted">
        <span>Signature / thumb impression: ______</span>
        <span>Date: ______</span>
      </div>
    </article>
  );
}
