export const DEADLINES = {
  claimWindowEnd: "2026-09-23",
  appealDays: 15,
  eroDecisionDays: 7,
  bloVisitDays: 5,
  notes: {
    claimWindowEnd: {
      value: "23 Sep 2026",
      source: "ECI SIR Phase II schedule — Karnataka draft roll 24 Aug 2026, claims & objections 24 Aug–23 Sep",
      kind: "verified",
    },
    appealDays: {
      value: "15 days from ERO order",
      source: "RPA 1950 s.24 appeal to DEO — timeline assumed, verify",
      kind: "assumption",
    },
    eroDecisionDays: {
      value: "7 days after hearing",
      source: "Assumed for demo pacing",
      kind: "assumption",
    },
    bloVisitDays: {
      value: "5 days after submission",
      source: "Assumed for demo pacing",
      kind: "assumption",
    },
  },
} as const;
