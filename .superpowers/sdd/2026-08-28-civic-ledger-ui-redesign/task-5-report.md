# Task 5 — Responsive claim preparation workspace

## Delivery

- Rebuilt the claim screen as a two-column workspace at 64rem and above, with decision controls first on narrow screens and a locally sticky form preview on wider screens.
- Reused `Shell` at `workspace` width and the shared `PageHeader`.
- Extracted the rendered decision controls into the pure `ClaimDecisionFields` unit. It retains every ground and evidence option and leaves the page as the owner of ground-change draft/evidence clearing.
- Preserved the existing API calls, saved-draft restoration, default ground selection, busy/error/fallback branches, routes, and action labels.
- Added semantic decision fieldsets and a labelled preview landmark. Language tabs now identify the form-language tablist and control the labelled form panel.
- Removed the page's synchronous `setState` calls from the effect by scheduling its existing session initialisation in a cancellable microtask. The loading screen still remains until the same session data is resolved, and the existing redirects are unchanged.

## RED → GREEN evidence

1. RED: `env -u OPENAI_API_KEY VITE_CONFIG_NATIVE_IGNORE_WARNING=true npm test -- tests/ui-claim-draft.test.tsx`
   - Failed before implementation because `@/components/ClaimDecisionFields` did not exist. This was the new behavioral contract for the required pure decision unit.
2. GREEN: the same command passed after implementing the unit and accessible form/tab contracts: 1 file, 2 tests passed.

## Verification

- Focused regression suite:
  `env -u OPENAI_API_KEY VITE_CONFIG_NATIVE_IGNORE_WARNING=true npm test -- tests/ui-claim-draft.test.tsx tests/draft.test.ts tests/api.test.ts`
  - Passed: 3 files, 16 tests.
- Full suite:
  `env -u OPENAI_API_KEY VITE_CONFIG_NATIVE_IGNORE_WARNING=true npm test`
  - Passed: 14 files, 72 tests.
- Changed-file lint:
  `VITE_CONFIG_NATIVE_IGNORE_WARNING=true npx eslint 'app/member/[id]/claim/page.tsx' components/ClaimDecisionFields.tsx components/FormPreview.tsx components/LangTabs.tsx components/AiBanner.tsx tests/ui-claim-draft.test.tsx`
  - Passed with no findings. This includes the previously reported `react-hooks/set-state-in-effect` location.
- Type check:
  `VITE_CONFIG_NATIVE_IGNORE_WARNING=true npx tsc --noEmit`
  - Passed with no errors.
- Diff whitespace check: `git diff --check` passed.

## Files

- `app/member/[id]/claim/page.tsx`
- `app/globals.css`
- `components/ClaimDecisionFields.tsx`
- `components/FormPreview.tsx`
- `components/LangTabs.tsx`
- `tests/ui-claim-draft.test.tsx`

`components/AiBanner.tsx` was reviewed but did not need a source change: its public props and both OpenAI/fallback branches are used unchanged by the relocated real preview.

## Self-review

- All six ground descriptions and all existing ground-specific evidence lists were moved verbatim to `ClaimDecisionFields` and are still selected by the same `ground` state.
- Changing ground continues to clear both the draft and selected evidence in the page-owned handler.
- Saved drafts restore both the draft object and its saved ground after the default-ground assignment, exactly as before.
- Draft generation preserves its request body and fallback/network handling; submission preserves the claim payload, deadline-specific error, and navigation route.
- The behavioral UI test checks the real fieldset legends and labels, generated form ground/evidence content, and actual tab/panel accessibility output. It does not inspect source text.

## Concerns

No known functional concerns. Layout behavior is covered by the shared CSS breakpoint implementation and server-rendered semantic tests; this task did not add a browser screenshot test.

## Fix round 1 — tab wiring and snapshot-derived workspace state

### Findings addressed

- `LangTabs` no longer hard-codes any panel identifier. It accepts optional `panelId` and `label` props while preserving its existing `value` and `onChange` interface. Both real consumers now pass a distinct panel ID.
- Each language tab has a deterministic ID, controls only its consumer's panel, exposes roving `tabIndex`, and supports ArrowLeft, ArrowRight, Home, and End. The pure `nextLanguageForKey` helper drives selection; focus follows the newly selected tab.
- The claim form panel and each claim card's message panel use `role="tabpanel"`, their own IDs, and `aria-labelledby` pointing at the active language tab.
- Replaced the claim page's `queueMicrotask`/effect-owned state initialization with the Task 4 `useSyncExternalStore` snapshot pattern. The parent derives household, confirmation, and per-member saved-draft snapshots; a keyed `ClaimWorkspace` lazily derives its first ground, evidence, and draft state from those props. The remaining effect performs redirects only.

### RED → GREEN evidence

1. RED: `env -u OPENAI_API_KEY VITE_CONFIG_NATIVE_IGNORE_WARNING=true npm test -- tests/ui-claim-draft.test.tsx`
   - Failed as expected: four behavioral assertions failed because the tab-ID/key helper functions and snapshot-derived initial-state helper did not exist, and the tracker/form relationships remained incomplete.
2. GREEN: the same test command passed after implementation: 1 file, 5 tests.

### Verification

- Affected focused suites:
  `env -u OPENAI_API_KEY VITE_CONFIG_NATIVE_IGNORE_WARNING=true npm test -- tests/ui-claim-draft.test.tsx tests/draft.test.ts tests/api.test.ts tests/claims.test.ts`
  - Passed: 4 files, 31 tests.
- Full suite:
  `env -u OPENAI_API_KEY VITE_CONFIG_NATIVE_IGNORE_WARNING=true npm test`
  - Passed: 14 files, 75 tests.
- Changed-file lint:
  `VITE_CONFIG_NATIVE_IGNORE_WARNING=true npx eslint 'app/member/[id]/claim/page.tsx' components/LangTabs.tsx components/FormPreview.tsx components/ClaimCard.tsx components/NotificationFeed.tsx tests/ui-claim-draft.test.tsx`
  - Passed with no findings.
- Type check: `VITE_CONFIG_NATIVE_IGNORE_WARNING=true npx tsc --noEmit` passed.
- Diff check: `git diff --check` passed.

### Fix-round self-review

- The visible form/claim behavior, draft API payload, deadline error, fallback state, routes, and action labels remain unchanged.
- The saved draft still overrides the default ground, while a missing draft starts with the status's first eligible ground and empty evidence. The keyed child prevents previous-member edits from carrying into a new member workspace.
- The page has no state setting inside its effect, and the member-specific saved-draft reader refreshes its snapshot if the route member ID changes.
