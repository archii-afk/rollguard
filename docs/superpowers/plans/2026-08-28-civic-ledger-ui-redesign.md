# Civic Ledger UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild RollGuard's complete citizen, officer, and honesty interfaces as a polished Civic Ledger experience that is purpose-built for mobile and desktop without changing product behavior.

**Architecture:** Keep all state, API, persistence, diff, match, draft, and transition contracts intact. Establish one responsive shell and a small set of semantic record components, then migrate route compositions in journey order so every task produces a functional app. Use server-renderable component contract tests for shared semantics and the existing integration suite for behavior.

**Tech Stack:** Next.js 16.3 App Router, React 19.2, TypeScript strict, Tailwind CSS v4, `next/font`, Vitest 4, React DOM server rendering.

**Spec:** `docs/superpowers/specs/2026-08-28-civic-ledger-ui-redesign.md`

## Global Constraints

- Read `AGENTS.md`, `node_modules/next/dist/docs/01-app/01-getting-started/11-css.md`, `node_modules/next/dist/docs/01-app/01-getting-started/13-fonts.md`, and `node_modules/next/dist/docs/03-architecture/accessibility.md` before implementation.
- Do not change APIs, payloads, storage keys, roll matching, draft schemas, claim transitions, deadlines, persistence behavior, or deterministic fallbacks.
- Do not introduce real EPIC, Aadhaar, PAN, phone, or person data; all EPICs keep the synthetic `ZZK` prefix.
- Do not introduce government logos or language that suggests this is an official Election Commission product.
- Keep every mock boundary listed in `MOCKED.md` visible in the interface and preserve `/about` disclosures.
- OpenAI calls remain server-only and restricted to `lib/match` and `lib/draft` with deterministic fallback.
- Meet WCAG AA contrast, preserve semantic landmarks and live regions, keep visible focus, support reduced motion, and use targets of at least 44 by 44 CSS pixels.
- Support 320 CSS pixels without horizontal scrolling and explicitly verify 390 by 844 and 1440 by 1100.
- Keep `lib/` framework-free. No `lib/` changes are expected.
- Use failing test, minimal implementation, green test, then commit for every task.

---

### Task 1: Civic Ledger foundations and responsive shell

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`
- Modify: `components/Shell.tsx`
- Create: `components/PageHeader.tsx`
- Modify: `vitest.config.ts`
- Create: `tests/ui-shell.test.tsx`

**Interfaces:**
- Consumes: existing `Shell`, `ActionBar`, `PrimaryButton`, and `SecondaryButton` call sites.
- Produces: `ShellWidth = "focus" | "workspace" | "wide"`; `Shell` prop `width?: ShellWidth`; `ActionBar` prop `width?: ShellWidth`; `PageHeader({ eyebrow, title, description, meta, children })`.
- Compatibility: retain `wide?: boolean` during migration and resolve it to `"wide"` when `width` is absent.

- [ ] **Step 1: Expand Vitest's include pattern and write the failing shell contract tests**

```ts
// vitest.config.ts
test: { environment: "node", include: ["tests/**/*.test.{ts,tsx}"] },

// tests/ui-shell.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ActionBar, Shell } from "@/components/Shell";
import { PageHeader } from "@/components/PageHeader";

describe("Civic Ledger shell", () => {
  it("maps the five route steps onto four visible journey phases", () => {
    const html = renderToStaticMarkup(<Shell step={2}><p>Consent</p></Shell>);
    expect(html).toContain("Check");
    expect(html).toContain("aria-current=\"step\"");
    expect(html).toContain("2 of 5");
    expect(html).toContain("Not an official Election Commission product");
  });

  it("exposes workspace width and a labeled action region", () => {
    expect(renderToStaticMarkup(<Shell width="workspace">Body</Shell>)).toContain("max-w-workspace");
    expect(renderToStaticMarkup(<ActionBar width="workspace">Act</ActionBar>)).toContain("aria-label=\"Page actions\"");
  });

  it("renders a single semantic page heading", () => {
    const html = renderToStaticMarkup(<PageHeader eyebrow="Part 112" title="Your household" description="Review every name." />);
    expect(html.match(/<h1/g)).toHaveLength(1);
    expect(html).toContain("Review every name.");
  });
});
```

- [ ] **Step 2: Run the shell tests and verify the new contracts fail**

Run: `npm test -- tests/ui-shell.test.tsx`

Expected: FAIL because `PageHeader` and the new width/action contracts do not exist.

- [ ] **Step 3: Add typography, palette, surface, width, focus, and motion foundations**

```tsx
// app/layout.tsx
import { Newsreader } from "next/font/google";
const display = Newsreader({ subsets: ["latin"], weight: ["500", "600", "700", "800"], variable: "--font-display", display: "swap" });
```

```css
/* app/globals.css: define these inside @theme */
--color-paper: #f5f0e5;
--color-paper-deep: #e8dfd0;
--color-card: #fffdf7;
--color-ink: #242027;
--color-muted: #655d5f;
--color-line: #c8bcaa;
--color-violet: #47266d;
--color-violet-soft: #eee5f4;
--color-stamp: #ad2941;
--color-stamp-soft: #f5e1e4;
--color-ledger: #1d6d49;
--color-ledger-soft: #e1efe6;
--spacing-page: clamp(1rem, 3vw, 2rem);

.max-w-focus { max-width: 44rem; }
.max-w-workspace { max-width: 76rem; }
.max-w-wide { max-width: 88rem; }
.paper-grain { background-image: radial-gradient(rgb(56 45 36 / 8%) .55px, transparent .55px); background-size: 5px 5px; }
@media (prefers-reduced-motion: reduce) { *, *::before, *::after { scroll-behavior: auto !important; animation-duration: .01ms !important; animation-iteration-count: 1 !important; } }
```

- [ ] **Step 4: Implement the compatible shell, action region, and page header**

```tsx
// components/Shell.tsx
export type ShellWidth = "focus" | "workspace" | "wide";
const WIDTH: Record<ShellWidth, string> = {
  focus: "max-w-focus",
  workspace: "max-w-workspace",
  wide: "max-w-wide",
};
const PHASES = [
  { label: "Check", steps: [1, 2] },
  { label: "Review", steps: [3] },
  { label: "Claim", steps: [4] },
  { label: "Track", steps: [5] },
] as const;

// Resolve `const shellWidth = width ?? (wide ? "wide" : "focus")`.
// Render a desktop <ol> over PHASES, with aria-current="step" on the active phase.
// Keep the mobile label `Step {step} of 5` so assistive copy matches route semantics.
// Render ActionBar as <aside aria-label="Page actions"> with WIDTH[width].
```

```tsx
// components/PageHeader.tsx
export function PageHeader({ eyebrow, title, description, meta, children }: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  meta?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return <header className="page-header">
    {eyebrow && <div className="record-kicker">{eyebrow}</div>}
    <div className="page-header-grid"><div><h1>{title}</h1>{description && <p>{description}</p>}</div>{children}</div>
    {meta && <div className="record-meta">{meta}</div>}
  </header>;
}
```

- [ ] **Step 5: Run focused and baseline verification**

Run: `npm test -- tests/ui-shell.test.tsx && npm run lint`

Expected: shell tests PASS and ESLint exits 0.

- [ ] **Step 6: Commit the foundation**

```bash
git add app/layout.tsx app/globals.css components/Shell.tsx components/PageHeader.tsx vitest.config.ts tests/ui-shell.test.tsx
git commit -m "feat: establish civic ledger design system"
```

### Task 2: Shared record, status, provenance, and feedback components

**Files:**
- Create: `components/RecordMeta.tsx`
- Modify: `components/MemberCard.tsx`
- Modify: `components/StatusChip.tsx`
- Modify: `components/ProvenanceCard.tsx`
- Modify: `components/MockBadge.tsx`
- Modify: `components/AiBanner.tsx`
- Modify: `components/Countdown.tsx`
- Modify: `components/Skeleton.tsx`
- Create: `tests/ui-records.test.tsx`

**Interfaces:**
- Consumes: existing `MemberAssessment`, `Provenance`, and status props.
- Produces: `RecordMeta({ items: Array<{ label: string; value: React.ReactNode }> })`; unchanged public props for all existing components.

- [ ] **Step 1: Write failing semantic tests for record metadata, status redundancy, provenance, and mock disclosure**

```tsx
// tests/ui-records.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RecordMeta } from "@/components/RecordMeta";
import { StatusChip } from "@/components/StatusChip";
import { MockBadge } from "@/components/MockBadge";

describe("record components", () => {
  it("renders labeled record values as a definition list", () => {
    const html = renderToStaticMarkup(<RecordMeta items={[{ label: "Part", value: 112 }, { label: "House", value: 14 }]} />);
    expect(html).toContain("<dl");
    expect(html).toContain("<dt>Part</dt>");
    expect(html).toContain("<dd>112</dd>");
  });

  it("puts status meaning in text rather than color alone", () => {
    expect(renderToStaticMarkup(<StatusChip status="MARKED_DEAD" />)).toContain("Marked deceased");
  });

  it("labels mocked behavior explicitly", () => {
    expect(renderToStaticMarkup(<MockBadge label="mock OTP" />)).toContain("mock OTP");
  });
});
```

- [ ] **Step 2: Run the record tests and verify the missing component fails**

Run: `npm test -- tests/ui-records.test.tsx`

Expected: FAIL because `RecordMeta` does not exist.

- [ ] **Step 3: Implement the record metadata primitive and restyle existing semantic components**

```tsx
// components/RecordMeta.tsx
export function RecordMeta({ items, className = "" }: {
  items: Array<{ label: string; value: React.ReactNode }>;
  className?: string;
}) {
  return <dl className={`record-meta-list ${className}`}>{items.map(({ label, value }) =>
    <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
  )}</dl>;
}
```

```tsx
// components/MemberCard.tsx: preserve its button and MatchConfirm behavior.
// Replace the loose serial/relation row with RecordMeta, keep the name and reason,
// and render the visual Stamp aria-hidden beside the textual StatusChip.
<RecordMeta items={[
  { label: "Serial", value: serial ?? "Not enumerated" },
  { label: "EPIC", value: m.epic ?? "No EPIC yet" },
  { label: "Relation", value: m.relationToHead },
]} />
```

Apply `.record-card`, `.record-meta-list`, `.docket-notice`, `.stamp`, `.status-chip`, and skeleton surface classes in `app/globals.css`. Keep `role="status"`, `role="alert"`, `aria-live`, and `aria-busy` behavior unchanged.

- [ ] **Step 4: Run focused tests and the full component-dependent suite**

Run: `npm test -- tests/ui-records.test.tsx tests/diff.test.ts tests/match.test.ts`

Expected: all selected tests PASS.

- [ ] **Step 5: Commit the shared record system**

```bash
git add app/globals.css components/RecordMeta.tsx components/MemberCard.tsx components/StatusChip.tsx components/ProvenanceCard.tsx components/MockBadge.tsx components/AiBanner.tsx components/Countdown.tsx components/Skeleton.tsx tests/ui-records.test.tsx
git commit -m "feat: refine civic record components"
```

### Task 3: Landing, OTP, and consent experience

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/consent/page.tsx`
- Modify: `app/globals.css`
- Modify: `tests/ui-shell.test.tsx`

**Interfaces:**
- Consumes: `Shell`, `PageHeader`, `ActionBar`, button components, existing session utilities, and `/api/household`.
- Produces: no new public interfaces; preserves `epic → otp → verify` state and all redirects.

- [ ] **Step 1: Add failing source contracts for the responsive landing and consent disclosure**

```tsx
// tests/ui-shell.test.tsx
import fs from "node:fs";

it("keeps the entry journey and consent disclosures explicit", () => {
  const landing = fs.readFileSync("app/page.tsx", "utf8");
  const consent = fs.readFileSync("app/consent/page.tsx", "utf8");
  expect(landing).toContain("landing-ledger-grid");
  expect(landing).toContain("Edit EPIC");
  expect(consent).toContain("Consent to read");
  expect(consent).toContain("Mock consent");
});
```

- [ ] **Step 2: Run the focused test and verify it fails on the new layout markers**

Run: `npm test -- tests/ui-shell.test.tsx`

Expected: FAIL because the new responsive composition and Edit EPIC action are absent.

- [ ] **Step 3: Build the split landing docket and transform it for OTP**

```tsx
// app/page.tsx: keep verify() unchanged and compose the existing state like this.
<Shell step={1} width="workspace">
  <div className="landing-ledger-grid">
    <section className="landing-story">{/* deadline, headline, explanation, sample source slip */}</section>
    <section className="entry-docket" aria-labelledby="entry-title">
      <span className="folio">RG / 001</span>
      <h2 id="entry-title">{stage === "epic" ? "Start with one voter" : "Verify this household"}</h2>
      {/* existing EPIC or OTP input and existing error live region */}
      {stage === "otp" && <button type="button" onClick={() => { setStage("epic"); setOtp(""); }}>Edit EPIC</button>}
    </section>
  </div>
</Shell>
```

Use a non-fixed desktop submit button inside the docket and the existing safe-area `ActionBar` on mobile through responsive CSS. Keep demo filling, format validation, unknown-household copy, session clearing, and navigation unchanged.

- [ ] **Step 4: Recompose consent as a readable access record**

```tsx
// app/consent/page.tsx
<Shell step={2} width="workspace">
  <PageHeader eyebrow="Check · consent" title="Before we read the roll" description="You control what RollGuard reads for this check." />
  <div className="consent-layout">
    <section className="record-card" aria-labelledby="consent-title">
      <h2 id="consent-title">Consent to read</h2><MockBadge label="Mock consent" />
      {/* existing five Row values unchanged */}
    </section>
    <aside className="trust-note">This session reads two synthetic electoral-roll snapshots and nothing else.</aside>
  </div>
</Shell>
```

- [ ] **Step 5: Run UI, API, and redirect behavior tests**

Run: `npm test -- tests/ui-shell.test.tsx tests/api.test.ts tests/api-claims.test.ts`

Expected: all selected tests PASS.

- [ ] **Step 6: Commit the entry journey**

```bash
git add app/page.tsx app/consent/page.tsx app/globals.css tests/ui-shell.test.tsx
git commit -m "feat: redesign household entry journey"
```

### Task 4: Household review and member explanation

**Files:**
- Modify: `app/household/page.tsx`
- Modify: `app/member/[id]/page.tsx`
- Modify: `app/globals.css`
- Modify: `components/MemberCard.tsx`
- Modify: `components/ProvenanceCard.tsx`
- Create: `components/HouseholdSummary.tsx`
- Create: `tests/ui-household.test.tsx`

**Interfaces:**
- Consumes: existing assessment counts, confirmation state, `applyConfirmation`, `MemberCard`, and provenance arrays.
- Produces: `HouseholdSummary({ total, action, confirm, fresh, correct })` with a semantic `<dl>`; no behavior changes.

- [ ] **Step 1: Write failing summary and page-hierarchy tests**

```tsx
// tests/ui-household.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { HouseholdSummary } from "@/components/HouseholdSummary";

describe("household review", () => {
  it("summarizes status counts with labels", () => {
    const html = renderToStaticMarkup(<HouseholdSummary total={6} action={2} confirm={1} fresh={1} correct={2} />);
    expect(html).toContain("6");
    expect(html).toContain("Members");
    expect(html).toContain("Need action");
    expect(html).toContain("Need confirmation");
  });
});
```

- [ ] **Step 2: Run the household test and verify the new component is missing**

Run: `npm test -- tests/ui-household.test.tsx`

Expected: FAIL because `HouseholdSummary` does not exist.

- [ ] **Step 3: Implement the summary and responsive family board**

```tsx
// components/HouseholdSummary.tsx
export function HouseholdSummary(p: { total: number; action: number; confirm: number; fresh: number; correct: number }) {
  const items = [["Members", p.total], ["Need action", p.action], ["Need confirmation", p.confirm], ["New voter", p.fresh], ["Looks right", p.correct]] as const;
  return <dl className="household-summary">{items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>;
}
```

```tsx
// app/household/page.tsx: retain all existing useEffect/useMemo handlers.
<Shell step={3} width="workspace">
  <PageHeader eyebrow={`AC 153 · Part ${household.partNo} · House ${household.houseNo}`} title="Your household on the draft roll" description={summary} />
  <HouseholdSummary total={assessments.length} action={counts.action} confirm={counts.confirm} fresh={counts.fresh} correct={counts.correct + counts.fine} />
  <ol className="member-record-grid">{/* existing MemberCard mapping */}</ol>
</Shell>
```

On desktop use a two-column record grid only when cards have sufficient room; an expanded ambiguous-match card spans the grid. On mobile retain one column and the fixed `Fix N names` action.

- [ ] **Step 4: Recompose member detail in decision-first order**

```tsx
// app/member/[id]/page.tsx
<Shell step={4} width="workspace">
  <PageHeader eyebrow={`${a.member.relationToHead} · House ${data.household.houseNo}`} title={a.member.name.en} meta={<StatusChip status={a.status} looksCorrect={a.looksCorrect} />} />
  <div className="member-detail-grid">
    <div>{/* What went wrong, next action, and law requirement */}</div>
    <aside aria-label="Source evidence"><ProvenanceCard items={a.provenance} /></aside>
  </div>
</Shell>
```

Keep all no-action, ambiguous confirmation, form selection, and redirect branches unchanged.

- [ ] **Step 5: Run household, diff, match, and seed tests**

Run: `npm test -- tests/ui-household.test.tsx tests/diff.test.ts tests/match.test.ts tests/seed.test.ts`

Expected: all selected tests PASS.

- [ ] **Step 6: Commit review screens**

```bash
git add app/household/page.tsx 'app/member/[id]/page.tsx' app/globals.css components/HouseholdSummary.tsx components/MemberCard.tsx components/ProvenanceCard.tsx tests/ui-household.test.tsx
git commit -m "feat: redesign household review workspace"
```

### Task 5: Responsive claim preparation workspace

**Files:**
- Modify: `app/member/[id]/claim/page.tsx`
- Modify: `app/globals.css`
- Modify: `components/FormPreview.tsx`
- Modify: `components/LangTabs.tsx`
- Modify: `components/AiBanner.tsx`
- Create: `tests/ui-claim-draft.test.tsx`

**Interfaces:**
- Consumes: existing `ground`, `evidence`, `draft`, `lang`, `busy`, and `error` state plus existing API functions.
- Produces: no new data interfaces; `FormPreview` and `LangTabs` props remain unchanged.

- [ ] **Step 1: Add failing structural contracts for fieldsets and the split preview**

```tsx
// tests/ui-claim-draft.test.tsx
import fs from "node:fs";
import { describe, expect, it } from "vitest";

describe("claim preparation", () => {
  it("groups decisions semantically and exposes a preview workspace", () => {
    const source = fs.readFileSync("app/member/[id]/claim/page.tsx", "utf8");
    expect(source).toContain("<fieldset");
    expect(source).toContain("claim-workspace");
    expect(source).toContain("aria-label=\"Form preview\"");
  });
});
```

- [ ] **Step 2: Run the claim UI contract and verify it fails**

Run: `npm test -- tests/ui-claim-draft.test.tsx`

Expected: FAIL because the current groups use generic sections and there is no split workspace.

- [ ] **Step 3: Recompose controls and preview without changing event handlers**

```tsx
// app/member/[id]/claim/page.tsx
<Shell step={4} width="workspace">
  <PageHeader eyebrow={`Form ${a.suggestedForm ?? "6"} · ${a.member.name.en}`} title="Build the claim" description="Choose the reason and supporting evidence, then review the prepared form." />
  <div className="claim-workspace">
    <div className="claim-controls">
      <fieldset><legend>Why is the draft roll wrong?</legend>{/* existing ground radios */}</fieldset>
      {ground && <fieldset><legend>Evidence you can attach</legend>{/* existing evidence checks and MockBadge */}</fieldset>}
    </div>
    <aside className="claim-preview" aria-label="Form preview">
      {/* existing busy, draft, fallback, language, and error branches */}
    </aside>
  </div>
</Shell>
```

Make `.claim-preview` locally sticky on wide screens. On mobile it returns to normal flow below the controls. Keep changing ground clearing the draft, session draft restoration, submission, deadline errors, and button labels unchanged.

- [ ] **Step 4: Refine the form artifact and accessible language tabs**

```tsx
// components/LangTabs.tsx: retain button behavior and add explicit tab relationships.
<div role="tablist" aria-label="Form language">
  {options.map((option) => <button role="tab" aria-selected={value === option.value} aria-controls="form-language-panel" key={option.value}>{option.label}</button>)}
</div>

// components/FormPreview.tsx: wrapper keeps existing fields and declarations.
<section id="form-language-panel" role="tabpanel" aria-label={`${lang} form preview`} className="form-paper">
  {/* unchanged draft data */}
</section>
```

- [ ] **Step 5: Run draft, API, and UI tests**

Run: `npm test -- tests/ui-claim-draft.test.tsx tests/draft.test.ts tests/api.test.ts`

Expected: all selected tests PASS.

- [ ] **Step 6: Commit the claim workspace**

```bash
git add 'app/member/[id]/claim/page.tsx' app/globals.css components/FormPreview.tsx components/LangTabs.tsx components/AiBanner.tsx tests/ui-claim-draft.test.tsx
git commit -m "feat: create responsive claim workspace"
```

### Task 6: Current-state-first claim tracking

**Files:**
- Modify: `app/claims/page.tsx`
- Modify: `app/globals.css`
- Modify: `components/ClaimCard.tsx`
- Modify: `components/Timeline.tsx`
- Modify: `components/NotificationFeed.tsx`
- Create: `components/ClaimNow.tsx`
- Create: `tests/ui-tracker.test.tsx`

**Interfaces:**
- Consumes: existing `Claim`, `HistoryEntry`, `Notification`, `nextDemoEvent`, deadlines, and event handler.
- Produces: `ClaimNow({ claim: Claim })` that describes the current state and next preparation using existing state only.

- [ ] **Step 1: Write failing current-state summary tests**

```tsx
// tests/ui-tracker.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ClaimNow } from "@/components/ClaimNow";
import type { Claim } from "@/lib/claims";

it("leads a scheduled visit with the current state and visit date", () => {
  const claim = { state: "BLO_FIELD_VERIFICATION", history: [{ state: "BLO_FIELD_VERIFICATION", at: "2026-08-28T00:00:00.000Z", note: "Visit scheduled for 2 September" }] } as Claim;
  const html = renderToStaticMarkup(<ClaimNow claim={claim} />);
  expect(html).toContain("Currently");
  expect(html).toContain("BLO field verification");
  expect(html).toContain("Visit scheduled for 2 September");
});
```

- [ ] **Step 2: Run the tracker test and verify the summary component is missing**

Run: `npm test -- tests/ui-tracker.test.tsx`

Expected: FAIL because `ClaimNow` does not exist.

- [ ] **Step 3: Implement current-state messaging from existing claim data**

```tsx
// components/ClaimNow.tsx
import { STATE_LABELS } from "./Timeline";
import type { Claim } from "@/lib/claims";

export function ClaimNow({ claim }: { claim: Claim }) {
  const latest = claim.history.at(-1);
  return <section className="claim-now" aria-label="Current claim status">
    <span>Currently</span>
    <h3>{STATE_LABELS[claim.state].title}</h3>
    {latest?.note && <p>{latest.note}</p>}
  </section>;
}
```

- [ ] **Step 4: Recompose tracker cards around current state, then history and messages**

```tsx
// components/ClaimCard.tsx
<article className={`claim-record ${tone}`}>
  <header>{/* existing name, form, ground, acknowledgement, countdown */}</header>
  <ClaimNow claim={claim} />
  <div className="claim-detail-grid">
    <section aria-labelledby={`timeline-${claim.id}`}><Timeline history={claim.history} current={claim.state} /></section>
    <section aria-labelledby={`messages-${claim.id}`}><LangTabs value={lang} onChange={setLang} /><NotificationFeed items={claim.notifications} lang={lang} /></section>
  </div>
  {/* existing real appeal action, separately styled demo transition, and error */}
</article>
```

Use `Shell step={5} width="workspace"` in `app/claims/page.tsx`. Keep seeding, sorting the newly created claim first, storage disclosure, reset, conflict recovery, and event order unchanged.

- [ ] **Step 5: Run tracker, claims, and API tests**

Run: `npm test -- tests/ui-tracker.test.tsx tests/claims.test.ts tests/api-claims.test.ts tests/seed.test.ts`

Expected: all selected tests PASS.

- [ ] **Step 6: Commit claim tracking**

```bash
git add app/claims/page.tsx app/globals.css components/ClaimCard.tsx components/ClaimNow.tsx components/Timeline.tsx components/NotificationFeed.tsx tests/ui-tracker.test.tsx
git commit -m "feat: clarify current claim status"
```

### Task 7: Officer queue and trust ledger

**Files:**
- Modify: `app/blo/page.tsx`
- Modify: `app/about/page.tsx`
- Modify: `app/globals.css`
- Create: `components/QueueSummary.tsx`
- Create: `tests/ui-trust.test.tsx`

**Interfaces:**
- Consumes: existing claims grouped by `ClaimState`, existing mock-role disclosure, and existing About facts.
- Produces: `QueueSummary({ total, dueSoon, groups })`; no transition or persistence changes.

- [ ] **Step 1: Write failing officer-summary and honesty-page contracts**

```tsx
// tests/ui-trust.test.tsx
import { renderToStaticMarkup } from "react-dom/server";
import fs from "node:fs";
import { describe, expect, it } from "vitest";
import { QueueSummary } from "@/components/QueueSummary";

it("summarizes the officer queue without implying a real login", () => {
  const html = renderToStaticMarkup(<QueueSummary total={4} dueSoon={2} groups={3} />);
  expect(html).toContain("4");
  expect(html).toContain("Awaiting field visit");
});

it("keeps the trust ledger's required disclosures", () => {
  const about = fs.readFileSync("app/about/page.tsx", "utf8");
  expect(about).toContain("Not an official");
  expect(about).toContain("Working today");
  expect(about).toContain("Mocked");
});
```

- [ ] **Step 2: Run the trust tests and verify the queue component is missing**

Run: `npm test -- tests/ui-trust.test.tsx`

Expected: FAIL because `QueueSummary` does not exist.

- [ ] **Step 3: Implement the queue summary and operational layout**

```tsx
// components/QueueSummary.tsx
export function QueueSummary({ total, dueSoon, groups }: { total: number; dueSoon: number; groups: number }) {
  return <dl className="queue-summary"><div><dt>Total claims</dt><dd>{total}</dd></div><div><dt>Awaiting field visit</dt><dd>{dueSoon}</dd></div><div><dt>Active stages</dt><dd>{groups}</dd></div></dl>;
}

// app/blo/page.tsx
<Shell width="wide">
  <PageHeader eyebrow="Officer view · Part 112" title="Claims queue" description="Review claims by their current deterministic state.">{<MockBadge label="Mock role" />}</PageHeader>
  <QueueSummary total={claims.length} dueSoon={dueSoon} groups={byState.length} />
  {/* existing groups, notes, buttons, conflict message, and citizen-view link */}
</Shell>
```

Strengthen state-group headers and card action hierarchy. Keep each existing button's event payload byte-for-byte equivalent.

- [ ] **Step 4: Recompose About as the trust ledger without altering facts**

```tsx
// app/about/page.tsx
<Shell width="workspace">
  <PageHeader eyebrow="Trust ledger" title="What is real, what is mocked" description="RollGuard is a prototype built on synthetic electoral-roll data." />
  <nav aria-label="About this prototype">{/* anchor links: Working, Mocked, Deadlines, Limitations */}</nav>
  <div className="about-ledger-grid">{/* existing sections and tables, unchanged claims and sources */}</div>
</Shell>
```

Preserve deployment-aware AI and persistence text, deadline verification pills, source links, known limitations, and all routes.

- [ ] **Step 5: Run trust, transition, database, and API tests**

Run: `npm test -- tests/ui-trust.test.tsx tests/claims.test.ts tests/db.test.ts tests/api-claims.test.ts`

Expected: all selected tests PASS.

- [ ] **Step 6: Commit officer and trust surfaces**

```bash
git add app/blo/page.tsx app/about/page.tsx app/globals.css components/QueueSummary.tsx tests/ui-trust.test.tsx
git commit -m "feat: redesign officer and trust surfaces"
```

### Task 8: Full responsive, accessibility, and production verification

**Files:**
- Modify: `TESTING.md`

**Interfaces:**
- Consumes: the complete redesigned application and the existing test scenarios.
- Produces: a verified build and updated manual-testing instructions that name both mobile and desktop checks.

- [ ] **Step 1: Run the complete automated baseline**

Run: `npm test && npm run lint && npm run build`

Expected: all Vitest tests PASS, ESLint exits 0, and the Next.js production build exits 0 with no type errors.

- [ ] **Step 2: Start the production build and capture required viewport evidence**

Run:

```bash
npm run start
# In an isolated headless browser profile, capture `/`, `/household?epic=ZZK1400001`, `/claims`, `/blo`, and `/about`
# at 390x844 and 1440x1100; also inspect document.scrollWidth <= document.documentElement.clientWidth at 320px.
```

Expected: every page renders at both target viewports and the 320-pixel check reports no horizontal overflow.

- [ ] **Step 3: Complete the manual citizen and officer flows**

Use `TESTING.md` scenarios A through H. Additionally verify:

```text
- Tab order follows visible order on split desktop layouts.
- The first Tab reveals Skip to content.
- Every radio, checkbox, language tab, card action, and footer link is keyboard reachable.
- At 200% zoom the current-state block, provenance, form preview, and actions remain readable.
- With reduced motion, stamps and page entrances appear without animated travel.
- Browser console has no errors on all reviewed routes.
```

Expected: every item passes. Fix discovered defects in the smallest owning component and rerun the relevant focused test before continuing.

- [ ] **Step 4: Update the testing guide with desktop and Civic Ledger checks**

```markdown
<!-- Add to TESTING.md under local UI verification -->
### Responsive Civic Ledger checks

- Mobile: 390 × 844 and 320 CSS pixels, no horizontal overflow, safe-area action bar clear of focused controls.
- Desktop: 1440 × 1100, landing uses the story/docket split, claim drafting uses controls/preview, and tracker uses current-state/history columns.
- Accessibility: visible keyboard focus, reduced-motion behavior, 200% zoom, status meaning without color, and explicit mock labels.
- Honesty: unofficial-product footer, synthetic-data language, AI or fallback attribution, persistence disclosure, and mocked-role boundaries remain visible.
```

- [ ] **Step 5: Rerun final verification after all visual fixes**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: all commands exit 0.

- [ ] **Step 6: Commit verified polish and testing documentation**

```bash
git add TESTING.md app components tests vitest.config.ts
git commit -m "test: verify civic ledger experience"
```
