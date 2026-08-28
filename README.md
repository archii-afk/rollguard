# RollGuard

**Is your family still on the voter list?** A prototype for *Build What Moves India* (Aug 2026).

The 2026 Special Intensive Revision of electoral rolls flagged crores of names as absent, shifted, dead or duplicate. Official portals check one name at a time. RollGuard takes one EPIC number, finds the whole household, diffs it across two roll snapshots, explains *why* each name was flagged (with the exact roll row it came from), drafts the Form 6/8 claim in English, Kannada and Hindi, and tracks the claim through BLO → ERO → speaking order → appeal, with the 23 September deadline counting down.

- **Live demo:** https://rollguard-eight.vercel.app — or jump straight to the family board: https://rollguard-eight.vercel.app/household?epic=ZZK1400001
- **Demo EPIC:** `ZZK1400001` — the Rafeeq household, House 14, Part 112, AC-153 Shantinagar (fictional). Any six digits pass the mock OTP.
- **What is real and what is mocked:** [`MOCKED.md`](./MOCKED.md), also rendered at `/about`.
- **How to test it, screen by screen, with scenarios:** [`TESTING.md`](./TESTING.md)

Not an official Election Commission of India product. All data is synthetic.

## Run locally

```bash
npm install
cp .env.example .env.local   # add OPENAI_API_KEY; optional OPENAI_MODEL
npm run gen                  # regenerate the synthetic rolls (deterministic)
npm run dev
```

Without an API key every AI step falls back to deterministic rules and says so in the interface. Without `DATABASE_URL` claims fall back to browser storage and `/about` says so; with it (Neon via the Vercel integration) claims are shared between the citizen tracker and the officer queue across devices.

## Layout

| Path | What |
|---|---|
| `lib/rolls` | Roll types, loaders, synthetic data generator |
| `lib/diff` | Household resolution, name normalisation, fuzzy pre-filter, nine-way status classifier with provenance |
| `lib/match` | OpenAI ranking of ambiguous identity matches, with rule-based fallback |
| `lib/draft` | OpenAI Form 6/8 drafting (strict JSON schema, EN/KN/HI), with template fallback |
| `lib/claims` | Deterministic claim state machine, deadlines, SMS-style notifications, demo script; `db.ts` persists claims in Postgres (Neon) with server-side transitions and an optimistic state check |
| `app/api/*` | Thin route handlers over the modules above |
| `app/*` | Mobile-first citizen journey; `/about` is the honesty page |
| `tests/` | Vitest suites for every `lib` module and the API routes — `npm test` |

## How it was built

Backend modules, API routes and their tests were implemented with OpenAI Codex from a written spec and task plan, then reviewed with Codex code review. At runtime the app uses an OpenAI model for exactly two narrow jobs — ranking ambiguous roll entries and drafting the trilingual declaration. Every decision that affects an outcome (status, deadline, state transition) is deterministic, unit-tested code.
