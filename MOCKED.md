# What is real and what is mocked

RollGuard is a hackathon prototype. It is **not** an official Election Commission of India product.

## Working today
- Household resolution and two-roll diff over synthetic roll snapshots (`data/roll-2025.json`, `data/roll-2026-draft.json`)
- Deterministic status classification (`lib/diff`)
- AI cross-script identity ranking for ambiguous matches (`lib/match`, OpenAI) with rule-based fallback
- AI Form 6/8 drafting in English, Kannada, Hindi (`lib/draft`, OpenAI) with template fallback
- Deterministic claim state machine with deadlines and notifications (`lib/claims`)

## Mocked
| Boundary | How it is mocked | What production would need |
|---|---|---|
| Electoral rolls | Fictional "AC-153 Shantinagar, Part 112"; seeded generator + hand-authored demo household | Per-booth roll PDFs/CSVs from CEO portals or an ECINET API; OCR/parsing layer |
| EPIC lookup + OTP | Any `ZZK…` EPIC in the seed; any 6-digit OTP | ECINET/NVSP identity + SMS OTP |
| Consent screen | Static mock modelled on DigiLocker/ECINET consent | Real consent artefact + audit log |
| Evidence uploads | Placeholder images, nothing stored | DigiLocker fetch or upload with virus scan + retention policy |
| ECINET submission + ack number | Locally generated ack | Form 6/8 API submission or assisted BLO filing |
| BLO / ERO / DEO actions and timings | "Simulate next step" control walks scripted outcomes; `/blo` shows the officer-side queue with no real role switch | Integration with ERO-Net workflow events and officer authentication |
| Deadlines | Constants in `lib/claims/config.ts` with source/assumption notes | Verified from ECI schedule per state |
| Claim persistence | Browser localStorage via `ClaimStore` | Postgres implementation of the same interface |

## Known limitations
- Form 6/8 field names are modelled on public ECI forms but not validated against the current ECINET schema.
- Appeal timelines (`appealDays`) are an assumption pending verification of RPA 1950 s.24 practice.
- Transliteration normalisation covers Latin↔Kannada for common Muslim/Hindu/Christian name patterns in the seed; it is not general.
- No accessibility audit beyond 44 px targets, contrast tokens and semantic HTML.
