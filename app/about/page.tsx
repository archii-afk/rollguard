import Link from "next/link";
import { Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";
import { MockBadge } from "@/components/MockBadge";
import { DEADLINES } from "@/lib/claims";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-5.6";
const AI_ON = !!process.env.OPENAI_API_KEY;
const DB_ON = !!process.env.DATABASE_URL;

const WORKING = [
  ["Household resolution and two-roll diff", "lib/diff over synthetic roll snapshots for one booth"],
  ["Nine-way status classification with provenance", "Deterministic rules; every status cites roll vintage, part, serial and field"],
  ["Cross-script identity ranking", `OpenAI ${MODEL} ranks only the ambiguous pairs the rule pre-filter finds; rule-based fallback`],
  ["Form 6 / Form 8 drafting in English, Kannada, Hindi", `OpenAI ${MODEL} with a strict JSON schema; template fallback`],
  ["Claim state machine, deadlines, SMS-style notifications", "lib/claims — pure functions, unit-tested; the model never decides state"],
  ...(DB_ON
    ? [["Claim persistence", "Postgres (Neon) behind /api/claims, keyed by the household's EPIC; transitions run server-side with an optimistic state check, so the citizen tracker and the officer queue read one record"]]
    : []),
];

const MOCKED = [
  ["Electoral rolls", "Fictional AC-153 Shantinagar, Part 112; seeded generator plus a hand-authored demo household", "Per-booth roll PDFs/CSVs from CEO portals or an ECINET API; parsing layer"],
  ["EPIC lookup and OTP", "Any ZZK EPIC in the seed; any six digits", "ECINET/NVSP identity with SMS OTP"],
  ["Consent screen", "Static mock modelled on DigiLocker consent", "Consent artefact with audit log"],
  ["Evidence uploads", "Checklist only; nothing is stored", "DigiLocker fetch or upload with scanning and retention rules"],
  ["Submission and acknowledgement number", "Generated locally", "Form 6/8 API submission or assisted BLO filing"],
  ["BLO, ERO and DEO actions", "“Simulate next step” walks a scripted outcome; the officer queue at /blo has no real login", "ERO-Net workflow events and officer authentication"],
  ...(DB_ON
    ? [["Officer identity", "Anyone can open /blo and act as the BLO", "Officer authentication and an audit trail on every transition"]]
    : [["Claim persistence", "This browser’s storage behind a ClaimStore interface (no database configured on this deployment)", "Server-side store keyed by the acknowledgement number"]]),
];

export default function About() {
  return (
    <Shell width="workspace">
      <PageHeader
        eyebrow="Trust ledger"
        title="What is real, what is mocked"
        description="RollGuard is a prototype built on synthetic electoral-roll data."
      />

      <p className="about-disclosure">
        RollGuard is a hackathon prototype built for <em>Build What Moves India</em>. It is not an Election Commission of India product, uses no real
        voter data, and every simulated boundary is marked with a <MockBadge /> pill in the interface.
      </p>

      <nav className="about-ledger-nav" aria-label="About this prototype">
        <a href="#working">Working</a>
        <a href="#mocked">Mocked</a>
        <a href="#deadlines">Deadlines</a>
        <a href="#limitations">Limitations</a>
      </nav>

      <div className="about-ledger-grid">
      <Section id="problem" title="The problem it addresses">
        <ul className="list-disc pl-5 space-y-1 text-[15px] max-w-prose">
          <li>SIR Phase II removed 5.18 crore names across 12 states (10.2% of rolls), including 66.9 lakh marked deceased.</li>
          <li>Karnataka’s draft roll of 24 Aug 2026 placed 1.07 crore names in the absent / shifted / dead / duplicate lists; the CEO website went down the same day.</li>
          <li>Claims and objections run 24 Aug – 23 Sep 2026. After the Supreme Court upheld SIR on 27 May 2026, this window is the only recourse.</li>
          <li>ECI’s own rule — no deletion without notice and a speaking order by the ERO — is the legal basis for every claim this tool drafts.</li>
        </ul>
        <p className="mt-2 text-xs text-muted">Figures from ECI publications, PIB releases and parliamentary answers as of 27 Aug 2026.</p>
      </Section>

      <Section id="working" title="Working today">
        <Table rows={WORKING} head={["Capability", "How"]} />
        <p className="mt-2 text-xs text-muted">
          AI on this deployment: {AI_ON ? `enabled (${MODEL})` : "disabled — every screen shows the rule-based fallback with a banner"}.
        </p>
      </Section>

      <Section id="mocked" title="Mocked">
        <Table rows={MOCKED} head={["Boundary", "In this prototype", "What production needs"]} />
      </Section>

      <Section id="deadlines" title="Deadlines used by the state machine">
        <Table
          head={["Setting", "Value", "Source", ""]}
          rows={Object.entries(DEADLINES.notes).map(([k, n]) => [k, n.value, n.source, n.kind])}
          renderLast={(v) => (
            <span className={`rounded-sm border px-1.5 py-0.5 text-[10px] font-mono uppercase ${v === "verified" ? "border-ledger/40 text-ledger" : "border-amber/50 text-amber"}`}>{v}</span>
          )}
        />
      </Section>

      <Section id="built" title="How it was built">
        <p className="text-[15px] max-w-prose">
          The backend modules — roll diff engine, identity ranking, form drafting, claim state machine and their Vitest suites — and the API routes were
          implemented with OpenAI Codex working from a written spec and task plan, then reviewed with Codex’s code review. At runtime the app calls
          OpenAI {MODEL} for exactly two narrow jobs: ranking ambiguous roll entries and drafting the trilingual declaration. Everything that decides an
          outcome — statuses, deadlines, transitions — is deterministic code.
        </p>
      </Section>

      <Section id="limitations" title="Known limitations">
        <ul className="list-disc pl-5 space-y-1 text-[15px] max-w-prose">
          <li>Form 6/8 fields follow the public ECI forms but are not validated against the live ECINET schema.</li>
          <li>The appeal timeline is an assumption pending verification of RPA 1950 s.24 practice.</li>
          <li>Name normalisation covers Latin-script variants common in the seed; Kannada script is displayed, not matched.</li>
          <li>Only a citizen restoring their own family’s names is supported — no objections against other electors, by design.</li>
          <li>Accessibility: 44 px targets, visible focus, semantic HTML; no full audit.</li>
        </ul>
      </Section>
      </div>

      <p className="mt-8 text-sm">
        <Link href="/" className="underline underline-offset-2 text-violet">Start the demo</Link>
        {" · "}Demo EPIC <span className="font-mono">ZZK1400001</span>
        {" · "}<Link href="/household?epic=ZZK1400001" className="underline underline-offset-2 text-violet">Jump to the family board</Link>
        {" · "}<Link href="/blo" className="underline underline-offset-2 text-violet">Officer queue</Link>
      </p>
    </Shell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="about-ledger-section">
      <h2 className="font-display font-semibold text-xl mb-2">{title}</h2>
      {children}
    </section>
  );
}

function Table({ head, rows, renderLast }: { head: string[]; rows: string[][]; renderLast?: (v: string) => React.ReactNode }) {
  return (
    <div className="about-ledger-table overflow-x-auto rounded-md border border-line bg-card" tabIndex={0}>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-[11px] font-mono uppercase tracking-wider text-muted border-b border-line">
            {head.map((h, i) => <th key={i} className="px-3 py-2 font-normal">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-line align-top">
          {rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={`px-3 py-2 ${j === 0 ? "font-medium" : "text-ink/85"}`}>
                  {renderLast && j === r.length - 1 ? renderLast(c) : c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
