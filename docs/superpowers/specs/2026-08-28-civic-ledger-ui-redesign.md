# RollGuard Civic Ledger UI Redesign

## Summary

RollGuard will be redesigned as a responsive civic workspace with an editorial “public record” character. The interface will combine warm paper surfaces, precise typographic hierarchy, tactile source slips, restrained aubergine ink, carmine intervention stamps, and ledger green success states.

The redesign covers the complete citizen journey, the officer queue, and the honesty page. Existing APIs, routes, data models, deterministic claim transitions, synthetic data, and fallback behavior remain unchanged.

## Goals

- Make the product polished and memorable on both mobile phones and desktop demonstrations.
- Help citizens understand the current situation, the decision they need to make, and the next action without hiding legal or provenance details.
- Use desktop space for parallel context and working views instead of stretching the current narrow mobile column.
- Preserve RollGuard's accessibility-first foundation and visibly honest mock boundaries.
- Establish reusable layout and record components so the product feels like one coherent service.

## Non-goals

- Changing matching, drafting, roll-diff, persistence, claim-state, or notification logic.
- Adding new API endpoints, authentication, uploads, official branding, or real personal data.
- Making the prototype appear to be an official Election Commission product.
- Inventing new legal claims, workflow steps, or production capabilities.

## Visual Direction

### Civic Ledger

The product should feel like a careful human interpretation of a public record, not a generic dashboard and not an official government portal. The interface uses the visual language of ledgers, source rows, filing slips, folio numbers, stamps, and ruled paper without compromising readability.

Core choices:

- Warm paper is the dominant background and canvas.
- Aubergine is the primary action and orientation color.
- Carmine marks draft-roll interventions, errors, and destructive outcomes.
- Ledger green marks verified or successful outcomes.
- Newsreader provides editorial display type, Atkinson Hyperlegible remains the body face, IBM Plex Mono presents EPIC numbers, serials, dates, acknowledgements, and provenance, while the existing Kannada and Devanagari faces remain in use.
- Shadows are compact and physical, often paired with a small offset edge rather than soft floating-card effects.
- Texture is quiet: subtle paper grain, ruled rows, and seal-like geometry must never compete with content.
- Motion is purposeful: staged entrances, stamp placement, progress transitions, and button feedback. Reduced-motion preferences disable nonessential animation.

## Experience Architecture

The current five-step product flow remains intact, but its visible wording can be condensed to four user-facing phases: Check, Review, Claim, and Track. Consent remains an explicit screen inside the Check phase and keeps its existing route and semantics.

### Desktop

Desktop pages use a maximum content width of approximately 1180 to 1240 pixels with page-specific grids:

- Landing: editorial explanation on the left and a focused EPIC-entry docket on the right.
- Household review: household context and status summary alongside a wider member-card grid or list.
- Member detail: explanation and source evidence arranged in a balanced two-column layout where space allows.
- Claim preparation: reason and evidence controls on the left with a sticky, live trilingual Form 6 or Form 8 preview on the right.
- Claim tracking: claim overview, current state, timeline, and messages use a wider structured record layout.
- BLO queue: preserve the operational wide view and strengthen grouping, status summaries, and action hierarchy.
- About: use an editorial document layout with clear sections for real behavior, mocked behavior, privacy, and data sources.

### Mobile

Mobile remains a one-decision-at-a-time journey:

- Content stacks into a single column with 16-pixel page gutters.
- Primary actions remain thumb reachable and respect safe-area insets.
- The current state or required decision appears before supporting chronology or provenance.
- Dense desktop summaries collapse into compact counts and filterable or clearly grouped records.
- No horizontal scrolling is required at 320 CSS pixels.

### Global Shell

The shared shell provides:

- A skip link and stable focus target.
- A responsive header with the RollGuard wordmark, progress orientation, and About access.
- A compact four-phase desktop progress treatment and a concise current-phase indicator on mobile.
- Page-width variants for focused, workspace, and operational screens.
- A responsive action area that is sticky on mobile and can become an inline or locally sticky action group on desktop.
- A consistent footer stating that the product is unofficial and uses synthetic data.

## Screen Design

### Landing and OTP

The landing page leads with the citizen outcome and claim deadline. A tactile example roll slip shows the problem without dominating the form. Desktop uses a split hero and docket. Mobile stacks the explanation, deadline, example, and EPIC form.

The OTP stage transforms the same docket rather than presenting an unrelated second form. Entered EPIC data remains visible, and users can return to edit it. Demo affordances remain explicit.

### Consent

Consent becomes a readable record of what is accessed, why, for how long, and with whom it is shared. The Allow and Deny choices remain unambiguous. Mock labeling stays adjacent to the consent title and explanatory copy.

### Household Review

The household page starts with a compact status summary: total members, needs action, needs confirmation, new voter, and looks correct or unchanged. Member records retain source-like identifiers and human explanations.

Actionable members receive visual priority through border, stamp, copy, and action affordance rather than color alone. Existing ambiguous-match confirmation stays within the relevant record. The main action reports exactly how many names require attention.

### Member Detail

Member detail answers three questions in order: what happened, why RollGuard reached that conclusion, and what the law requires next. Provenance stays visible as source rows with roll vintage, part, serial, previous value, and draft value.

### Claim Preparation

Claim preparation separates citizen decisions from generated paperwork. The citizen chooses a ground and placeholder evidence in the control pane. Once drafted, the form preview stays available beside those decisions on desktop and below them on mobile.

The preview preserves English, Kannada, and Hindi tabs. AI or deterministic-fallback attribution remains visible next to the draft, and the interface instructs the citizen to review before submitting.

### Claim Tracking

Each claim leads with its present state and immediate preparation or deadline, followed by its full timeline. Acknowledgement number, form, ground, and dates remain visible. Messages remain available in all three languages.

Demo-transition controls are visually separated from real citizen actions and labeled as simulated. Rejected and appealed states retain their existing deterministic behavior and deadline messages.

### BLO Queue

The officer view remains explicitly mocked. A summary row communicates total claims and visits awaiting scheduling. Claims group by state with clearer cards, current owner, recent note, and available state-machine actions. Citizen and officer views continue to read the same persistence layer.

### About

The About page becomes the product's trust ledger. It distinguishes implemented behavior from mocked boundaries, explains data handling and persistence, names both AI tasks and their fallbacks, and repeats the unofficial-product notice.

## Component Structure

The implementation should evolve the existing components rather than create a second parallel design system.

Shared boundaries:

- `Shell`: responsive header, progress, content widths, footer, and action placement.
- `PageHeader`: eyebrow, title, description, metadata, and optional status summary.
- `ActionBar`: mobile safe-area behavior and desktop local alignment.
- `RecordCard`: shared paper/ledger surface treatment for members, consent rows, claims, and queue items where semantics overlap.
- `RecordMeta`: consistent EPIC, serial, part, house, date, and acknowledgement presentation.
- `StatusChip` and `Stamp`: retain status semantics while adopting the new tokens and physical treatment.
- `ProvenanceCard`: source-row comparison optimized for both stacked and wide layouts.
- `FormPreview`: becomes suitable for a sticky desktop preview without changing draft data.
- `Timeline` and `NotificationFeed`: strengthen current-state emphasis while preserving complete history and multilingual messages.
- Existing focused components such as `Countdown`, `LangTabs`, `AiBanner`, `MockBadge`, and skeletons remain reusable and receive visual-system updates.

Page-specific composition should stay in the route page unless a repeated semantic unit emerges. No business logic moves into visual components.

## Data and State Flow

All current flows remain unchanged:

1. EPIC and mock OTP lead to `/api/household`.
2. Household and confirmation data stay in the existing client session utilities.
3. Ambiguous matching continues through `/api/match` with deterministic fallback.
4. Drafting continues through `/api/draft` with deterministic fallback and the existing strict schema.
5. Claims continue through the existing claims API abstraction and shared deterministic transition module.
6. Postgres and browser-storage persistence behavior remains exactly as implemented.

The redesign may reorganize rendering state, but it must not change payloads, storage keys, transition rules, deadlines, or fallback decisions.

## Failure and Loading States

- Loading states reserve the final layout's approximate space to avoid layout shift.
- Errors appear beside the task that failed as docket notices, not as remote global banners.
- User input, selected grounds, and evidence choices survive recoverable failures.
- Every recoverable failure offers a clear retry or return action.
- Network, not-found, deadline-missed, invalid-transition, and state-conflict messages preserve their current truthful distinctions.
- Empty states explain the next available action.
- Disabled actions explain readiness through adjacent copy or the visible state of required fields; color is never the only signal.

## Accessibility and Content Requirements

- Meet WCAG AA contrast for all text and interactive states.
- Preserve semantic landmarks, heading order, labels, fieldsets, lists, live regions, and alert roles.
- Preserve visible focus and full keyboard operation.
- Keep interactive targets at least 44 by 44 CSS pixels, with 48 pixels preferred for primary journey actions.
- Support reduced motion and zoom without loss of content or control.
- Use text plus shape or icon for every status.
- Keep English copy direct and plain. Kannada and Hindi content must retain appropriate font classes and spacing.
- Maintain the synthetic-data, mock-boundary, fallback, and unofficial-product disclosures.

## Implementation Surface

Expected changes are concentrated in:

- `app/globals.css` and `app/layout.tsx` for tokens, typography, texture, global motion, and viewport theme.
- `components/Shell.tsx` and the existing shared presentation components.
- Citizen route pages under `app/` for responsive compositions.
- `app/blo/page.tsx` and `app/about/page.tsx` for their wider layouts.
- UI and smoke tests where semantic labels or layout contracts change.

No `lib/` or API changes are expected. If implementation reveals that behavior must change, work stops for a design amendment before altering those contracts.

## Verification

The redesign is complete only when all of the following pass:

- Existing Vitest suite.
- ESLint.
- Next.js production build.
- Keyboard-only traversal of the full citizen journey.
- Responsive visual checks at 390 by 844 and 1440 by 1100, plus a 320-pixel-wide overflow check.
- Manual demo journey: EPIC, OTP, consent, household, member explanation, trilingual claim draft, submission, tracker, and simulated transition.
- Officer queue and About page checks.
- Reduced-motion behavior and visible-focus checks.
- Console inspection for errors on all reviewed screens.

## Acceptance Criteria

- Both mobile and desktop feel intentionally designed rather than scaled versions of each other.
- Every current route and core action remains reachable and functional.
- Desktop task pages use available width productively.
- Mobile pages preserve a focused primary action and safe-area behavior.
- Provenance, mock boundaries, fallbacks, and unofficial status remain obvious.
- No real personal data, government logo, or unsupported production claim is introduced.
- The interface consistently expresses the Civic Ledger direction across citizen, officer, and About surfaces.
