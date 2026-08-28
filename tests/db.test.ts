import type { Pool, QueryResult } from "pg";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  PgClaimStore,
  StateConflict,
  seedDemo,
  setPoolForTests,
} from "@/lib/claims/db";
import { createClaim, transition, type Claim } from "@/lib/claims";

const filedAt = new Date("2026-08-26T10:00:00+05:30");

function result(rows: unknown[] = [], rowCount = rows.length): QueryResult {
  return { rows, rowCount, command: "", oid: 0, fields: [] } as QueryResult;
}

function submittedClaim(): Claim {
  return transition(
    createClaim(
      {
        memberId: "ameena",
        memberName: "Ameena Begum",
        form: "6",
        ground: "ALIVE_RESIDENT",
      },
      filedAt,
    ),
    { type: "SUBMIT" },
    filedAt,
  );
}

describe("PgClaimStore", () => {
  beforeEach(() => setPoolForTests(null));

  it("seedDemo inserts the two missing demo claims", async () => {
    const query = vi.fn(async (sql: string, _values?: unknown[]) => {
      void _values;
      if (sql.includes("SELECT payload") && sql.includes("household_epic")) return result([]);
      return result([], sql.includes("INSERT INTO claims") ? 1 : 0);
    });
    const store = new PgClaimStore({ query } as unknown as Pool);

    await expect(seedDemo(store, "ZZK1400001")).resolves.toBe(true);

    const inserts = query.mock.calls.filter(([sql]) => String(sql).includes("INSERT INTO claims"));
    expect(inserts).toHaveLength(2);
    expect(inserts.map(([, values]) => (values as unknown[])[2]).sort()).toEqual(["ameena", "imran"]);
    expect(inserts.map(([, values]) => (values as unknown[])[4])).toEqual([
      "CLAIM_SUBMITTED",
      "CLAIM_SUBMITTED",
    ]);
  });

  it("applies an event and updates with an optimistic state guard", async () => {
    const claim = submittedClaim();
    const query = vi.fn(async (sql: string, _values?: unknown[]) => {
      void _values;
      if (sql.includes("SELECT payload") && sql.includes("WHERE id")) return result([{ payload: claim }]);
      if (sql.includes("UPDATE claims")) return result([], 1);
      return result();
    });
    const store = new PgClaimStore({ query } as unknown as Pool);

    const next = await store.applyEvent(
      claim.id,
      "CLAIM_SUBMITTED",
      { type: "BLO_SCHEDULED", visitDate: "2026-09-02" },
      new Date("2026-08-28T10:00:00+05:30"),
    );

    expect(next.state).toBe("BLO_FIELD_VERIFICATION");
    const update = query.mock.calls.find(([sql]) => String(sql).includes("UPDATE claims"));
    expect(update?.[1]).toEqual([claim.id, "CLAIM_SUBMITTED", "BLO_FIELD_VERIFICATION", next]);
  });

  it("throws StateConflict when the selected payload differs from expectedState", async () => {
    const claim = submittedClaim();
    const query = vi.fn(async (sql: string, _values?: unknown[]) => {
      void _values;
      return sql.includes("SELECT payload") ? result([{ payload: claim }]) : result();
    });
    const store = new PgClaimStore({ query } as unknown as Pool);

    await expect(
      store.applyEvent(
        claim.id,
        "BLO_FIELD_VERIFICATION",
        { type: "HEARING_NOTICED", hearingDate: "2026-09-09" },
        filedAt,
      ),
    ).rejects.toBeInstanceOf(StateConflict);
  });

  it("throws StateConflict when the guarded update affects no row", async () => {
    const claim = submittedClaim();
    const query = vi.fn(async (sql: string, _values?: unknown[]) => {
      void _values;
      if (sql.includes("SELECT payload")) return result([{ payload: claim }]);
      if (sql.includes("UPDATE claims")) return result([], 0);
      return result();
    });
    const store = new PgClaimStore({ query } as unknown as Pool);

    await expect(
      store.applyEvent(
        claim.id,
        "CLAIM_SUBMITTED",
        { type: "BLO_SCHEDULED", visitDate: "2026-09-02" },
        filedAt,
      ),
    ).rejects.toBeInstanceOf(StateConflict);
  });
});
