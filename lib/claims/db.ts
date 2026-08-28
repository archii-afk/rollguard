import { Pool } from "pg";
import { createClaim, transition } from "./transition";
import type { Claim, ClaimEvent, ClaimState, Ground } from "./types";

let poolSingleton: Pool | undefined;
let schemaPromise: Promise<void> | null = null;

export function getPool(): Pool | null {
  if (poolSingleton) return poolSingleton;
  if (!process.env.DATABASE_URL) return null;
  poolSingleton = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 3,
  });
  return poolSingleton;
}

export function setPoolForTests(pool: Pool | null): void {
  poolSingleton = pool ?? undefined;
  schemaPromise = null;
}

export function ensureSchema(pool: Pool): Promise<void> {
  schemaPromise ??= pool
    .query(`
      CREATE TABLE IF NOT EXISTS claims (
        id text primary key,
        household_epic text not null,
        member_id text not null,
        part_no integer not null default 112,
        state text not null,
        payload jsonb not null,
        updated_at timestamptz not null default now()
      );
      CREATE INDEX IF NOT EXISTS claims_household_epic_idx ON claims (household_epic);
    `)
    .then(() => undefined);
  return schemaPromise;
}

export class StateConflict extends Error {
  constructor(
    public readonly expectedState: ClaimState,
    public readonly actualState?: ClaimState,
  ) {
    super(
      actualState
        ? `Claim state changed from ${expectedState} to ${actualState}`
        : `Claim is no longer in expected state ${expectedState}`,
    );
    this.name = "StateConflict";
  }
}

interface PayloadRow {
  payload: Claim;
}

export class PgClaimStore {
  constructor(private readonly pool: Pool) {}

  async listByHousehold(epic: string): Promise<Claim[]> {
    await ensureSchema(this.pool);
    const result = await this.pool.query<PayloadRow>(
      "SELECT payload FROM claims WHERE household_epic = $1 ORDER BY updated_at ASC",
      [epic],
    );
    return result.rows.map(row => row.payload);
  }

  async listAll(): Promise<Claim[]> {
    await ensureSchema(this.pool);
    const result = await this.pool.query<PayloadRow>(
      "SELECT payload FROM claims ORDER BY updated_at ASC",
    );
    return result.rows.map(row => row.payload);
  }

  async get(id: string): Promise<Claim | null> {
    await ensureSchema(this.pool);
    const result = await this.pool.query<PayloadRow>(
      "SELECT payload FROM claims WHERE id = $1",
      [id],
    );
    return result.rows[0]?.payload ?? null;
  }

  async insert(claim: Claim, epic: string): Promise<void> {
    await ensureSchema(this.pool);
    await this.pool.query(
      `INSERT INTO claims (id, household_epic, member_id, part_no, state, payload)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [claim.id, epic, claim.memberId, 112, claim.state, claim],
    );
  }

  async applyEvent(
    id: string,
    expectedState: ClaimState,
    event: ClaimEvent,
    now: Date,
  ): Promise<Claim> {
    await ensureSchema(this.pool);
    const selected = await this.pool.query<PayloadRow>(
      "SELECT payload FROM claims WHERE id = $1",
      [id],
    );
    const claim = selected.rows[0]?.payload;
    if (!claim || claim.state !== expectedState) {
      throw new StateConflict(expectedState, claim?.state);
    }

    const next = transition(claim, event, now);
    const updated = await this.pool.query(
      `UPDATE claims
       SET state = $3, payload = $4, updated_at = now()
       WHERE id = $1 AND state = $2`,
      [id, expectedState, next.state, next],
    );
    if (updated.rowCount === 0) throw new StateConflict(expectedState);
    return next;
  }

  async deleteByHousehold(epic: string): Promise<void> {
    await ensureSchema(this.pool);
    await this.pool.query("DELETE FROM claims WHERE household_epic = $1", [epic]);
  }
}

const DEMO: { memberId: string; memberName: string; ground: Ground }[] = [
  { memberId: "ameena", memberName: "Ameena Begum", ground: "ALIVE_RESIDENT" },
  { memberId: "imran", memberName: "Imran Rafeeq", ground: "NEVER_SHIFTED" },
];

const DEMO_FILED_AT = new Date("2026-08-26T10:00:00+05:30");

export async function seedDemo(store: PgClaimStore, epic: string): Promise<boolean> {
  const existingMembers = new Set(
    (await store.listByHousehold(epic)).map(claim => claim.memberId),
  );
  let seeded = false;
  for (const demo of DEMO) {
    if (existingMembers.has(demo.memberId)) continue;
    const draft = createClaim({ ...demo, form: "6" }, DEMO_FILED_AT);
    const householdDraft = { ...draft, id: `${epic}-${draft.id}` };
    const claim = transition(householdDraft, { type: "SUBMIT" }, DEMO_FILED_AT);
    await store.insert(claim, epic);
    seeded = true;
  }
  return seeded;
}
