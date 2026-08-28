import type { Claim } from "./types";

export interface ClaimStore {
  list(): Claim[];
  get(id: string): Claim | undefined;
  save(claim: Claim): void;
  clear(): void;
}

export class MemoryClaimStore implements ClaimStore {
  private readonly claims = new Map<string, Claim>();

  list(): Claim[] {
    return [...this.claims.values()];
  }

  get(id: string): Claim | undefined {
    return this.claims.get(id);
  }

  save(claim: Claim): void {
    this.claims.set(claim.id, claim);
  }

  clear(): void {
    this.claims.clear();
  }
}

const STORAGE_KEY = "rg:claims";

export class LocalStorageClaimStore implements ClaimStore {
  list(): Claim[] {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      const claims: unknown = JSON.parse(stored);
      return Array.isArray(claims) ? (claims as Claim[]) : [];
    } catch {
      return [];
    }
  }

  get(id: string): Claim | undefined {
    return this.list().find((claim) => claim.id === id);
  }

  save(claim: Claim): void {
    if (typeof window === "undefined") return;
    const claims = this.list().filter((stored) => stored.id !== claim.id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...claims, claim]));
  }

  clear(): void {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
