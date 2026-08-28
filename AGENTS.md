<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# RollGuard — project rules

Hackathon build for *Build What Moves India* (deadline 28 Aug 2026, 20:00 IST).

## Commit rules
- Plain commit messages with conventional subjects (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). **No AI co-author or session trailers of any kind.**

## Ground rules from the brief
- All data is synthetic. Never introduce real EPIC/Aadhaar/PAN/phone numbers, real names, or government logos. EPICs use the `ZZK` prefix.
- Every mock boundary must be listed in `MOCKED.md` and rendered on `/about`.
- OpenAI calls only from server code (`app/api/*`), only via `lib/match` and `lib/draft`, always with a deterministic fallback.
- State transitions and deadlines are deterministic code in `lib/claims`; the model never decides state.

## Engineering
- Next.js 16 App Router, TypeScript strict, Tailwind v4, Vitest. `npm test` must pass before any commit touching `lib/`.
- `lib/*` modules are pure and framework-free so they can be unit-tested and reused by both API routes and the client.
- Work TDD: failing test → minimal implementation → green → commit.
