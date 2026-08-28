import type { Provenance } from "@/lib/diff";

function vintageLabel(v: string) {
  return v.includes("draft") ? "Draft roll 2026-08" : `Roll ${v}`;
}

/** Where each conclusion came from: roll vintage, part, serial, field. Monospace on purpose — it is a ledger. */
export function ProvenanceCard({ items }: { items: Provenance[] }) {
  if (!items.length) return null;
  return (
    <section aria-label="Where this comes from" className="record-card provenance-card">
      <h3 className="px-3 py-2 text-[11px] font-mono uppercase tracking-wider text-muted border-b border-line">Source evidence</h3>
      <ul className="divide-y divide-line font-mono text-[13px]">
        {items.map((p, i) => (
          <li key={i} className="px-3 py-2 leading-snug">
            <div className="text-ink">
              {vintageLabel(p.vintage)} · Part {p.partNo}
              {p.serial ? ` · Sl. ${p.serial}` : ""}
            </div>
            <div className="text-muted">
              {p.field}
              {p.previous !== undefined && (
                <>
                  : <span className="text-ink">{p.previous}</span>
                </>
              )}
              {p.draft !== undefined && (
                <>
                  {p.previous !== undefined ? " → " : ": "}
                  <span className="text-stamp font-medium">{p.draft}</span>
                </>
              )}
            </div>
            {p.note && <div className="text-muted italic">{p.note}</div>}
          </li>
        ))}
      </ul>
    </section>
  );
}
