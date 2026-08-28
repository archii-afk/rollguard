import type { HouseholdResponse, DraftResponse } from "@/lib/api/types";

/** Per-journey state in sessionStorage. Every access is guarded: SSR, private mode, or a cleared tab must never throw. */
const KEYS = { household: "rg:household", confirmations: "rg:confirmations", drafts: "rg:drafts" } as const;

function read<T>(key: string): T | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, value: unknown) {
  try {
    if (typeof window !== "undefined") window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the journey still works for this render */
  }
}

export const saveHousehold = (h: HouseholdResponse) => write(KEYS.household, h);
export const loadHousehold = () => read<HouseholdResponse>(KEYS.household);

export type Confirmations = Record<string, number | "none">; // memberId → confirmed candidate serial, or "none"
export const loadConfirmations = () => read<Confirmations>(KEYS.confirmations) ?? {};
export function saveConfirmation(memberId: string, serial: number | "none") {
  write(KEYS.confirmations, { ...loadConfirmations(), [memberId]: serial });
}

export const loadDraft = (memberId: string) => (read<Record<string, DraftResponse>>(KEYS.drafts) ?? {})[memberId] ?? null;
export function saveDraft(memberId: string, d: DraftResponse) {
  write(KEYS.drafts, { ...(read<Record<string, DraftResponse>>(KEYS.drafts) ?? {}), [memberId]: d });
}

export function clearJourney() {
  try {
    Object.values(KEYS).forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    /* ignore */
  }
}
