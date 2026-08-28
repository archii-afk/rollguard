import { LocalStorageClaimStore, createClaim, transition, DeadlineMissed, InvalidTransition, type Claim, type ClaimEvent, type ClaimState, type Ground } from "@/lib/claims";
import { seedDemoClaims } from "@/lib/client/seedDemoClaims";

/**
 * One async interface over two persistence modes:
 *  - "postgres": the server keeps claims (Neon via /api/claims); the state machine runs on the server.
 *  - "browser":  no DATABASE_URL on the server → the same state machine runs here against localStorage.
 * Pages call these functions and never know which one they got, except to say so honestly on screen.
 */
export type Persistence = "postgres" | "browser";

export interface ClaimsApi {
  persistence: Persistence;
  list(): Promise<Claim[]>;
  listAll(): Promise<Claim[]>;
  create(input: { memberId: string; memberName: string; form: "6" | "8"; ground: Ground }): Promise<Claim>;
  apply(claim: Claim, event: ClaimEvent): Promise<Claim>;
  reset(): Promise<Claim[]>;
}

export class ClaimsApiError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, headers: { "content-type": "application/json", ...(init?.headers ?? {}) } });
  const body = (await res.json().catch(() => ({}))) as { error?: string; message?: string } & T;
  if (!res.ok) throw new ClaimsApiError(body.error ?? String(res.status), body.message ?? "Request failed");
  return body;
}

function remote(epic: string): ClaimsApi {
  const q = `epic=${encodeURIComponent(epic)}`;
  return {
    persistence: "postgres",
    list: async () => (await call<{ claims: Claim[] }>(`/api/claims?${q}`)).claims,
    listAll: async () => (await call<{ claims: Claim[] }>(`/api/claims?scope=all`)).claims,
    create: async (input) => (await call<{ claim: Claim }>(`/api/claims`, { method: "POST", body: JSON.stringify({ epic, ...input }) })).claim,
    apply: async (claim, event) =>
      (await call<{ claim: Claim }>(`/api/claims/${encodeURIComponent(claim.id)}/events`, { method: "POST", body: JSON.stringify({ expectedState: claim.state as ClaimState, event }) })).claim,
    reset: async () => (await call<{ claims: Claim[] }>(`/api/claims?${q}`, { method: "DELETE" })).claims,
  };
}

function browser(): ClaimsApi {
  const store = new LocalStorageClaimStore();
  const wrap = <T>(fn: () => T): T => {
    try {
      return fn();
    } catch (e) {
      if (e instanceof DeadlineMissed) throw new ClaimsApiError("DEADLINE_MISSED", e.message);
      if (e instanceof InvalidTransition) throw new ClaimsApiError("INVALID_TRANSITION", e.message);
      throw e;
    }
  };
  return {
    persistence: "browser",
    list: async () => { seedDemoClaims(store); return store.list(); },
    listAll: async () => { seedDemoClaims(store); return store.list(); },
    create: async (input) => wrap(() => {
      const now = new Date();
      const c = transition(createClaim(input, now), { type: "SUBMIT" }, now);
      store.save(c);
      return c;
    }),
    apply: async (claim, event) => wrap(() => { const next = transition(claim, event, new Date()); store.save(next); return next; }),
    reset: async () => { store.clear(); seedDemoClaims(store); return store.list(); },
  };
}

let cached: { epic: string; api: ClaimsApi } | null = null;

/** Probe once per session: if the server has a database, use it; otherwise fall back to the browser. */
export async function getClaimsApi(epic: string): Promise<ClaimsApi> {
  if (cached && cached.epic === epic) return cached.api;
  let api: ClaimsApi;
  try {
    const res = await fetch("/api/claims?probe=1");
    const status = await res.json() as { persistence?: Persistence };
    api = status.persistence === "browser" ? browser() : remote(epic);
  } catch {
    api = browser();
  }
  cached = { epic, api };
  return api;
}
