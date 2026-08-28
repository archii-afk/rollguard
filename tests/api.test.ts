import { describe, it, expect } from "vitest";
import { POST as household } from "@/app/api/household/route";
import { POST as match } from "@/app/api/match/route";
import { POST as draft } from "@/app/api/draft/route";

interface HouseholdResponse {
  assessments: Array<{
    member: { id: string };
    candidates: Array<{ entry: { serial: number } }>;
  }>;
}

const post = (fn: (r: Request) => Promise<Response>, body: unknown) => fn(new Request("http://x", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } }));

describe("/api/household", () => {
  it("400 on bad body", async () => expect((await post(household, {})).status).toBe(400));
  it("404 on unknown EPIC", async () => expect((await post(household, { epic: "ZZK0000000" })).status).toBe(404));
  it("returns six assessments for the demo EPIC", async () => {
    const r = await post(household, { epic: "ZZK1400001" }); expect(r.status).toBe(200);
    const j = await r.json(); expect(j.assessments).toHaveLength(6); expect(typeof j.ai.available).toBe("boolean");
  });
});
describe("/api/match", () => {
  it("ranks Rafeeq's candidates (fallback ok without key)", async () => {
    const j = await (await post(match, { epic: "ZZK1400001", memberId: "rafeeq" })).json();
    expect(j.rankings[0].candidateSerial).toBeGreaterThan(0); expect(["openai","fallback"]).toContain(j.source);
  });
  it("400 when member has no candidates", async () => expect((await post(match, { epic: "ZZK1400001", memberId: "salma" })).status).toBe(400));
});
describe("/api/draft", () => {
  it("drafts Ameena's Form 6", async () => {
    const j = await (await post(draft, { epic: "ZZK1400001", memberId: "ameena", ground: "ALIVE_RESIDENT", evidence: ["Ration card"] })).json();
    expect(j.draft.form).toBe("6"); expect(j.assessment.status).toBe("MARKED_DEAD");
  });
  it("applies candidateSerial before drafting Rafeeq's Form 8", async () => {
    const h = await (await post(household, { epic: "ZZK1400001" })).json() as HouseholdResponse;
    const serial = h.assessments.find((a) => a.member.id === "rafeeq")!.candidates[0].entry.serial;
    const j = await (await post(draft, { epic: "ZZK1400001", memberId: "rafeeq", ground: "NOT_DUPLICATE", evidence: [], candidateSerial: serial })).json();
    expect(j.assessment.status).toBe("DUPLICATE_FLAGGED"); expect(j.draft.form).toBe("8");
  });
});
