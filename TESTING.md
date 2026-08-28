# RollGuard — what it is, how it works, and how to test it

> Live: **https://rollguard-eight.vercel.app** · Board shortcut: **https://rollguard-eight.vercel.app/household?epic=ZZK1400001** · Officer view: **/blo** · Honesty page: **/about**
> Demo login: EPIC `ZZK1400001`, OTP = any six digits. All data is synthetic. Not an official ECI product.

---

## 1. What RollGuard is

India's 2026 Special Intensive Revision (SIR) of electoral rolls published *draft* rolls that mark names as **A**bsent, **S**hifted, **D**ead or **DU**plicate. Citizens have until **23 September 2026** to file claims (Form 6 for inclusion/restoration, Form 8 for corrections). Official portals check one name at a time, show a flag without a reason, and offer nothing for drafting or tracking a claim.

RollGuard takes **one EPIC number**, finds **everyone enrolled at that house**, compares the previous roll (Jan 2025) with the SIR draft roll (Aug 2026), and for each person:

1. says what happened and **why**, citing the exact roll row;
2. uses an OpenAI model only where rules can't decide — matching a person to a re-spelt entry (“Md. Rafik” ↔ “Mohammed Rafeeq”) and writing the claim declaration in **English, Kannada and Hindi**;
3. files the claim into a **deterministic state machine** (BLO field visit → ERO hearing → speaking order → restored / rejected → DEO appeal) with deadlines and SMS-style messages;
4. shows the **officer's side** of the same queue.

It also tells you when a deletion **looks correct** and should not be contested.

### What is real vs mocked (short version — full table at `/about` and `MOCKED.md`)

| Real and working | Mocked |
|---|---|
| Household resolution and two-roll diff (`lib/diff`) | The rolls themselves (fictional booth: AC-153 Shantinagar, Part 112) |
| Nine-way status classification with provenance | EPIC lookup and OTP (any six digits pass) |
| OpenAI identity ranking (`lib/match`) with rule fallback | Consent screen (modelled on DigiLocker) |
| OpenAI Form 6/8 drafting in EN/KN/HI (`lib/draft`) with template fallback | Evidence uploads (checklist only, nothing stored) |
| Claim state machine, deadlines, notifications (`lib/claims`) — 58 unit tests | Acknowledgement numbers (`SIR-153-112-xxxxxx`, generated) |
| Claims persisted in **Postgres (Neon)**, shared across devices and views | BLO / ERO / DEO actions and their timing (“Simulate next step”) |
| | Officer identity — anyone can open `/blo` |

---

## 2. The demo household (what the data contains)

Everything hinges on **House 14, Part 112, AC-153 Shantinagar** — the Rafeeq family. Enter any of their EPICs and you get the whole house.

| Member | EPIC | Age | Previous roll (Jan 2025) | SIR draft roll (Aug 2026) | Status you should see | Form / ground |
|---|---|---|---|---|---|---|
| **Mohammed Rafeeq** (head) | `ZZK1400001` | 47 | Sl. 152 | Re-entered as **“Md. Rafik”**, new EPIC `ZZK1400099`, flag **DU** | *Needs your confirmation* → after “Yes”: **Flagged duplicate** | Form 8 · *not a duplicate* |
| **Ameena Begum** (mother) | `ZZK1400002` | 73 | Sl. 153 | Same serial, flag **D** (“BLO field report: reported deceased by neighbour”) | **Marked deceased** — the stamp | Form 6 · *alive and resident* |
| **Salma Rafeeq** (wife) | `ZZK1400003` | 44 | Sl. 154 | Unchanged | **On the draft roll** — no action | — |
| **Imran Rafeeq** (son) | `ZZK1400004` | 23 | Sl. 155 | flag **S** (“house locked on two visits”) | **Marked shifted** | Form 6 · *never shifted* |
| **Farhan Rafeeq** (son) | `ZZK1400005` | 27 | Sl. 156 | flag **S** (“Form 8 shifting request received from Hubballi”) | **Marked shifted · looks correct** — no CTA | — (he really moved) |
| **Zoya Rafeeq** (daughter) | none | 18 | not enrolled | not enrolled | **Turned 18 — not enrolled** | Form 6 · *turned 18* |

There are ~40 other synthetic households (EPICs `ZZK01…` to `ZZK41…`, no household 14 among them) generated from a fixed seed; they exist so the fuzzy matcher has a realistic haystack. You can enter any EPIC from `data/roll-2025.json` to see a plain household with random A/S/D flags.

**Pre-loaded demo claims:** the first time a household's tracker is opened, two claims are seeded as already *submitted on 26 Aug*: Ameena (Form 6, alive & resident) and Imran (Form 6, never shifted). Imran is scripted to be **rejected** by the ERO and then **restored on appeal**; Ameena is scripted to be restored directly. Seeding is per member, so a claim you file yourself is never duplicated.

---

## 3. Every screen, what it does, and what to look for

### `/` — Landing (Step 1 of 5)
- Headline, the 1.07-crore fact, a live **countdown** to 23 Sep (turns red under 7 days).
- The **stamped roll entry** for Ameena — the problem in one glance.
- Three benefit lines with icons.
- **EPIC input** (uppercase, must match `ZZK` + 7 digits; the *Use demo EPIC* link fills it). “Send OTP” is disabled until the format is valid.
- **OTP input** appears after Send OTP (badge: *mock · any 6 digits*). “Check my family” is disabled until six digits are typed.
- On submit the app calls `POST /api/household`. Unknown EPIC → inline error: *No household found for … in Part 112. Try the demo EPIC ZZK1400001.*
- Footer on every page: *Not an official ECI product · synthetic data only* + link to `/about`.

### `/consent` — Consent (Step 2)
- Mock DigiLocker-style consent card: **what** is read (House 14, Part 112, 6 adult members), **versions**, **purpose**, **for how long** (this session), **shared with** (no one).
- **Deny** → back to `/`. **Allow and continue** → `/household`.
- Opening `/consent` with no session → redirected to `/`.

### `/household` — Family board (Step 3) — the hero screen
- Header: part/house, **summary line** (“2 need a claim · 1 to confirm · 1 new voter · 1 looks correct · 1 unchanged”). If the server has no OpenAI key an amber note says identity matches use rule scores only.
- One **roll card** per adult member: serial + EPIC, name in Latin and Kannada script, house/age/gender, a **status chip**, and for A/S/D/DU cases a **rubber stamp** across the entry.
- Card copy: a one-line reason; *Fix this →* on actionable cards; *looks correct — No action* on Farhan.
- **Match card** under Rafeeq: *“Mohammed Rafeeq is not on the draft roll under this EPIC. A similar entry exists: Md. Rafik…”* with a probability and reasons. While the model is thinking you see *Checking this match with AI — a few seconds* and a rule-based score; then the line becomes *Match by OpenAI gpt-5.6*. **Yes, that's Mohammed** re-classifies him as *Flagged duplicate* (Form 8); **No** makes him *Missing from draft* (Form 6).
- Sticky **Fix N names** button opens the first actionable member.
- Deep link: `/household?epic=ZZK1400001` works with no prior session (skips OTP/consent). Refreshing the page keeps the board (session storage). Opening it in a *new tab* without `?epic=` sends you to `/`.

### `/member/[id]` — What went wrong (Step 4)
- Name in both scripts, the stamp (or chip if there's no stamp).
- **What went wrong** — plain-language reason for this status.
- **Source rows** — the provenance card: previous roll row (vintage, part, serial) and the draft row (flag, BLO note).
- **What the law requires** — ECI's rule (no deletion without notice and a speaking order; claim window to 23 Sep).
- CTA: **Fix this — draft Form 6/8**, or **No action needed** (Salma, Farhan), or **Confirm on the board** (Rafeeq before you've answered the match card).

### `/member/[id]/claim` — Draft the claim (Step 4)
- **Ground** radio cards (options depend on status — see §2 table).
- **Evidence** checklist (badge: *placeholder · nothing is uploaded*).
- **Draft with AI** → `POST /api/draft`. Shows *Writing the declaration in English, Kannada and Hindi… usually 15–25 seconds*. Result: line *Draft by OpenAI gpt-5.6* (or an amber *AI unavailable — rule-based draft* banner), **language tabs** (English / ಕನ್ನಡ / हिन्दी), and the **paper form preview** (Form 6 or 8 header, fields table, declaration, attachments, signature line).
- **Submit claim** → `POST /api/claims` (creates the claim and applies `SUBMIT`) → `/claims?new=<id>` with the new claim highlighted.
- Changing the ground clears the draft; the draft is remembered in the session if you go back.

### `/claims` — Tracker (Step 5)
- One card per claim: name, form, ground, **ack number** (badge *mock*), a countdown (claim window while drafting; **appeal window** while rejected), the **timeline** (done steps filled with a check, current step ringed and marked *now*, rejected steps with a warning glyph, ERO/DEO notes quoted), and the **SMS feed** with language tabs.
- **Demo: simulate next step** (dashed, badge *demo*) applies the next scripted event. It disappears in terminal states.
- **File appeal to the DEO** is a real primary button that appears only in the *Claim rejected* state.
- Footer line tells you where claims live: *stored server-side in Postgres, keyed by your household's EPIC* (normal) or *this browser's storage* (if the deployment has no database).
- **Reset demo claims** wipes this household's claims and reseeds Ameena + Imran.

### `/blo` — Officer queue
- The BLO's view of the **same** claims, grouped by state, with the ground in officer language and the last note.
- Buttons per state: *Schedule field visit* → *Report to ERO · issue hearing notice* → *ERO: restore / ERO: reject* → (after an appeal) *DEO: allow appeal / DEO: dismiss*.
- Badge *mock role*: there is no login. Actions run the same state machine as the citizen view against the shared Postgres store.

### `/about` — What is real and what is mocked
- Problem figures with sources, *Working today* vs *Mocked* tables, the **deadline settings** with *verified*/*assumption* pills, how it was built (Codex + OpenAI), known limitations, and links to the demo, the board shortcut and the officer queue.

---

## 4. Test scenarios

Work through these on a phone (or a browser window ≈ 390 px wide) in a **private/incognito window** so nothing is cached. Each scenario lists exact expected results.

### A. Happy path — Ameena, deceased-but-alive (≈3 min)
1. Open `/`. Tap *Use demo EPIC* → *Send OTP* → type `123456` → *Check my family*.
   ✔ `/consent` shows **House 14, Part 112 … 6 adult members**.
2. *Allow and continue*.
   ✔ Board summary reads **2 need a claim · 1 to confirm · 1 new voter · 1 looks correct · 1 unchanged**; stamps on Ameena (**MARKED DECEASED · D**) and Imran (**MARKED SHIFTED · S**).
3. Tap Ameena's card.
   ✔ Source rows show *Roll 2025-01 · Sl. 153* and *Draft roll 2026-08 · Sl. 153 · flag: D — BLO field report: reported deceased by neighbour*.
4. *Fix this — draft Form 6* → ground *They are alive and live here* is pre-selected → tick two evidence items → *Draft with AI*.
   ✔ Within ~25 s: *Draft by OpenAI gpt-5.6*; Form 6 with name, EPIC `ZZK1400002`, husband's name Abdul Rasheed, House 14, Part 112, Shantinagar, age 73, ground *Alive and ordinarily resident at this address*. Declaration mentions serial 153 and the neighbour's report. Switch to ಕನ್ನಡ and हिन्दी — native script, not transliteration.
5. *Submit claim*.
   ✔ `/claims` opens with **Ameena** highlighted, an ack like `SIR-153-112-766871`, timeline at *Claim submitted · now*, one SMS.
6. Tap *Simulate next step* three times.
   ✔ BLO visit (2 Sept) → Hearing (9 Sept) → *Speaking order* with the quote *“Elector appeared with identity and residence proof; deletion set aside”* → **Name restored** (green header). The demo button disappears. SMS feed has 4 messages; switch to ಕನ್ನಡ to see the Kannada versions.

### B. Rejection and appeal — Imran (≈2 min)
1. On `/claims`, tap *Reset demo claims* if Imran isn't there.
2. On Imran's card, *Simulate next step* three times.
   ✔ Third step: **Claim rejected**, ERO note *“BLO reported house locked on two visits; elector not produced”*, red countdown **15 days left to appeal to the DEO**, timeline grows an *Appeal filed* node, and a solid **File appeal to the DEO** button appears.
3. Tap *File appeal to the DEO* (or the demo button).
   ✔ State *Appeal filed · now*, SMS *“…appeal has been filed with the DEO.”*
4. *Simulate next step*.
   ✔ **Name restored** with the DEO note *“no notice was served before deletion; ERO order set aside”*.

### C. The AI identity match — Rafeeq (≈1 min)
1. Open the board fresh (`/household?epic=ZZK1400001`).
   ✔ Rafeeq's card says *Needs your confirmation*; below it the match card shows **Md. Rafik · Sl. 152 · ZZK1400099 · House 14 · Age 47 · flag DU**, first *Checking this match with AI…*, then **99% likely** with reasons in full sentences (father's name matches in both scripts, age +1, etc.) and *Match by OpenAI gpt-5.6*.
2. Tap *Yes, that's Mohammed*.
   ✔ Chip becomes **Flagged duplicate**, reason *re-entered under a different spelling*, summary becomes **3 need a claim**, button becomes **Fix 4 names**.
3. Open Rafeeq → *Fix this — draft Form 8* → ground *It is the same person, entered twice* → *Draft with AI*.
   ✔ **FORM 8** preview; declaration asks to correct the name to “Mohammed Rafeeq” and remove the duplicate flag.
4. Variant: reload the board, tap **No** instead.
   ✔ Rafeeq becomes **Missing from draft** (Form 6, ground *alive and resident*).

### D. The tool that knows when *not* to file — Farhan and Salma
1. On the board, read Farhan's card.
   ✔ Chip *✓ Marked shifted · looks correct*, no *Fix this*, copy *“Farhan has moved and asked to shift — this deletion looks correct. No action.”*
2. Open Farhan and Salma.
   ✔ Both show **No action needed** (disabled primary) and a Back button; Farhan's page explains that contesting would be wrong.
3. Check the sticky button count: **Fix 3 names** (Ameena, Imran, Zoya) before confirming Rafeeq; Farhan and Salma are never counted.

### E. A first-time voter — Zoya
1. Open Zoya from the board.
   ✔ Header *not enumerated · no EPIC yet*; chip **Turned 18 — not enrolled**; source row *not enumerated in either roll*.
2. Draft the claim.
   ✔ Only ground is *They turned 18 and are not enrolled yet*; Form 6; EPIC field shows **—**; evidence list mentions date-of-birth proof and a photograph.

### F. Officer view and cross-device persistence (needs two browsers, ≈2 min)
1. Browser A (phone): `/claims` → simulate Ameena to *BLO field verification*.
2. Browser B (laptop, different browser or incognito): open `/blo`.
   ✔ Ameena is under **BLO field verification**; Imran under **Claim submitted**. Footer says actions run *against the shared Postgres store*.
3. In B, on Ameena: *Report to ERO · issue hearing notice*, then *ERO: reject*.
4. Back in A, **reload** `/claims`.
   ✔ Ameena now shows **Claim rejected** with the note *“Elector did not appear; BLO report stands”* and the appeal countdown — the phone sees what the officer did.
5. In A, tap *File appeal to the DEO*; in B reload `/blo`.
   ✔ Ameena appears under **Appeal filed** with *DEO: allow appeal / DEO: dismiss* buttons.
6. Concurrency: in A and B both open Imran at the same state, click *Simulate next step* in A, then the officer button in B **without reloading**.
   ✔ B shows *“That claim was updated elsewhere — queue refreshed.”* and no step is applied twice.

### G. Errors and guard-rails
| Do this | Expect |
|---|---|
| Type `ABC1234567` on `/` | *Send OTP* stays disabled (must start with `ZZK`) |
| Type `ZZK0000000`, OTP `000000`, *Check my family* | Red inline error: *No household found for ZZK0000000 in Part 112. Try the demo EPIC ZZK1400001.* |
| Type five OTP digits | *Check my family* stays disabled |
| On `/consent` tap *Deny* | Back to `/`, EPIC field empty |
| Open `/household` in a **new private tab** without `?epic=` | Redirected to `/` |
| Open `/member/ameena` in a new private tab | Redirected to `/` (no session) |
| Turn on airplane mode, tap *Draft with AI* | Error *Network problem while drafting. Try again.* — nothing is lost |
| Apply a step, then use browser **Back** | Timeline state is unchanged (state lives on the server, not in history) |
| Zoom the page to 200 % | No horizontal scroll; chips stay on one line; buttons remain tappable |
| Keyboard only (Tab / Enter) | Skip-to-content link appears on first Tab; every button and tab reachable; the sticky bar never hides the focused control |

### H. Honesty checks
1. Every mocked boundary carries a dashed **MOCK** pill: OTP, consent, evidence, ack number, demo stepper, officer role. Count them as you go.
2. `/about` → *Deadlines used by the state machine*: `claimWindowEnd` is **verified**; `appealDays`, `eroDecisionDays`, `bloVisitDays` are **assumption**.
3. `/about` → *AI on this deployment: enabled (gpt-5.6)* and *Claim persistence: Postgres (Neon)…* in the Working table.

### I. Other households (optional)
Pick any EPIC from `data/roll-2025.json` (e.g. open the JSON on GitHub and take an `epic` from house `07`). Enter it on `/`.
✔ A different household with random A/S/D flags; no match card unless the generator produced a near-duplicate; the tracker seeds Ameena/Imran claims *for that EPIC* (they are demo fixtures, keyed by household).

---

## 5. Testing the API directly (curl)

```bash
U=https://rollguard-eight.vercel.app
# household + statuses
curl -s -X POST $U/api/household -H 'content-type: application/json' -d '{"epic":"ZZK1400001"}' | jq '.ai, [.assessments[] | {id: .member.id, status, looksCorrect}]'
# AI match for Rafeeq
curl -s -X POST $U/api/match -H 'content-type: application/json' -d '{"epic":"ZZK1400001","memberId":"rafeeq"}' | jq '.source, .rankings[0]'
# AI draft for Ameena (15–25 s)
curl -s -X POST $U/api/draft -H 'content-type: application/json' -d '{"epic":"ZZK1400001","memberId":"ameena","ground":"ALIVE_RESIDENT","evidence":["Ration card"]}' | jq '.source, .draft.form, .draft.declaration.kn'
# claims for the household (seeds on first call)
curl -s "$U/api/claims?epic=ZZK1400001" | jq '.persistence, [.claims[] | {memberId, state, ackNo}]'
# apply an event (replace ID); a stale expectedState returns 409
curl -s -X POST "$U/api/claims/ID/events" -H 'content-type: application/json' -d '{"expectedState":"CLAIM_SUBMITTED","event":{"type":"BLO_SCHEDULED","visitDate":"2026-09-02"}}'
# officer view / reset
curl -s "$U/api/claims?scope=all" | jq '[.claims[] | {memberId, state}]'
curl -s -X DELETE "$U/api/claims?epic=ZZK1400001" | jq '[.claims[] | .state]'
```

Error shapes: `400 BAD_REQUEST`, `404 NO_HOUSEHOLD`, `400 NO_CANDIDATES` (match on a member with no ambiguity), `409 STATE_CONFLICT`, `422 INVALID_TRANSITION | DEADLINE_MISSED`, `503 NO_DB` (deployment without `DATABASE_URL`).

---

## 6. Running and testing locally

```bash
npm install
cp .env.example .env.local      # add OPENAI_API_KEY (and DATABASE_URL if you want shared claims)
npm run gen                     # regenerate the synthetic rolls (deterministic)
npm test                        # 58 Vitest tests: diff engine, state machine, AI adapters, DB store, API routes
npm run dev                     # http://localhost:3000
```

Without `OPENAI_API_KEY` every AI step falls back to rules/templates and says so on screen. Without `DATABASE_URL` claims fall back to browser storage and `/claims` and `/about` say so.

---

## 7. State machine reference

```
CLAIM_DRAFTED ──SUBMIT──▶ CLAIM_SUBMITTED ──BLO_SCHEDULED──▶ BLO_FIELD_VERIFICATION
  ──HEARING_NOTICED──▶ ERO_HEARING_NOTICE ──ORDER_ISSUED──▶ (ERO_SPEAKING_ORDER recorded) ──▶ RESTORED
                                                                                        └──▶ REJECTED ──FILE_APPEAL──▶ APPEAL_FILED ──APPEAL_DECIDED──▶ RESTORED
                                                                                                                                                  └──▶ APPEAL_REJECTED
```

- `SUBMIT` is refused after **23 Sep 2026** (`DEADLINE_MISSED`); `FILE_APPEAL` is refused more than **15 days** after the ERO order.
- Every transition appends an SMS-style notification in English, Kannada and Hindi.
- On the server each event is applied with an optimistic check (`WHERE state = expected`) so two devices can never double-apply a step.

## 8. Known limitations
- Form 6/8 fields follow the public ECI forms but are not validated against the live ECINET schema.
- The appeal timeline is an assumption pending verification of RPA 1950 s.24 practice.
- Name normalisation covers Latin-script variants in the seed; Kannada script is displayed, not matched.
- Only a citizen restoring their *own family's* names is supported — no objections against other electors, by design.
- Single light theme; no full accessibility audit beyond contrast, focus, targets and reduced motion.
