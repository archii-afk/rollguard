import type { Pool, QueryResult } from "pg";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "@/app/api/claims/route";
import { POST as POST_EVENT } from "@/app/api/claims/[id]/events/route";
import { setPoolForTests } from "@/lib/claims/db";
import type { Claim } from "@/lib/claims";

interface StoredRow {
  householdEpic: string;
  payload: Claim;
}

function result(rows: unknown[] = [], rowCount = rows.length): QueryResult {
  return { rows, rowCount, command: "", oid: 0, fields: [] } as QueryResult;
}

function fakePool() {
  const rows = new Map<string, StoredRow>();
  const query = vi.fn(async (sql: string, values?: unknown[]) => {
    if (sql.includes("CREATE TABLE") || sql.includes("CREATE INDEX")) return result();
    if (sql.includes("SELECT payload") && sql.includes("household_epic = $1")) {
      return result(
        [...rows.values()]
          .filter(row => row.householdEpic === values?.[0])
          .map(row => ({ payload: row.payload })),
      );
    }
    if (sql.includes("SELECT payload") && sql.includes("WHERE id = $1")) {
      const row = rows.get(String(values?.[0]));
      return result(row ? [{ payload: row.payload }] : []);
    }
    if (sql.includes("SELECT payload") && !sql.includes("WHERE")) {
      return result([...rows.values()].map(row => ({ payload: row.payload })));
    }
    if (sql.includes("INSERT INTO claims")) {
      const payload = values?.[5] as Claim;
      rows.set(payload.id, { householdEpic: String(values?.[1]), payload });
      return result([], 1);
    }
    if (sql.includes("UPDATE claims")) {
      const id = String(values?.[0]);
      const current = rows.get(id);
      if (!current || current.payload.state !== values?.[1]) return result([], 0);
      current.payload = values?.[3] as Claim;
      return result([], 1);
    }
    if (sql.includes("DELETE FROM claims")) {
      for (const [id, row] of rows) if (row.householdEpic === values?.[0]) rows.delete(id);
      return result();
    }
    return result();
  });
  return { pool: { query } as unknown as Pool, rows };
}

const jsonPost = (url: string, body: unknown) =>
  new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("claims API", () => {
  beforeEach(() => {
    delete process.env.DATABASE_URL;
    setPoolForTests(null);
  });
  afterEach(() => setPoolForTests(null));

  it("returns NO_DB from every handler when no pool is configured", async () => {
    const responses = await Promise.all([
      GET(new Request("http://x/api/claims?epic=ZZK1400001")),
      POST(jsonPost("http://x/api/claims", {})),
      DELETE(new Request("http://x/api/claims?epic=ZZK1400001", { method: "DELETE" })),
      POST_EVENT(jsonPost("http://x/api/claims/id/events", {}), {
        params: Promise.resolve({ id: "id" }),
      }),
    ]);
    for (const response of responses) {
      expect(response.status).toBe(503);
      expect(await response.json()).toEqual({ error: "NO_DB" });
    }
  });

  it("reports browser persistence to a client probe without a failed request", async () => {
    const response = await GET(new Request("http://x/api/claims?probe=1"));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ persistence: "browser" });
  });

  it("GET seeds and returns household claims with the persistence marker", async () => {
    const fake = fakePool();
    setPoolForTests(fake.pool);

    const response = await GET(new Request("http://x/api/claims?epic=ZZK1400001"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.persistence).toBe("postgres");
    expect(body.claims.map((claim: Claim) => claim.memberId).sort()).toEqual(["ameena", "imran"]);
  });

  it("POST creates and submits a claim", async () => {
    const fake = fakePool();
    setPoolForTests(fake.pool);

    const response = await POST(
      jsonPost("http://x/api/claims", {
        epic: "ZZK1400001",
        memberId: "salma",
        memberName: "Salma Begum",
        form: "8",
        ground: "CORRECT_DETAILS",
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.claim).toMatchObject({ memberId: "salma", state: "CLAIM_SUBMITTED" });
  });

  it("POST /events applies a validated event with promise params", async () => {
    const fake = fakePool();
    setPoolForTests(fake.pool);
    const created = await (
      await POST(
        jsonPost("http://x/api/claims", {
          epic: "ZZK1400001",
          memberId: "salma",
          memberName: "Salma Begum",
          form: "6",
          ground: "ALIVE_RESIDENT",
        }),
      )
    ).json();

    const response = await POST_EVENT(
      jsonPost(`http://x/api/claims/${created.claim.id}/events`, {
        expectedState: "CLAIM_SUBMITTED",
        event: { type: "BLO_SCHEDULED", visitDate: "2026-09-02" },
      }),
      { params: Promise.resolve({ id: created.claim.id }) },
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.claim.state).toBe("BLO_FIELD_VERIFICATION");
  });
});
