import { STATE_LABELS } from "./Timeline";
import type { Claim } from "@/lib/claims";

export function ClaimNow({ claim }: { claim: Claim }) {
  const latest = claim.history.at(-1);

  return (
    <section className="claim-now" aria-label="Current claim status">
      <span>Currently</span>
      <h3>{STATE_LABELS[claim.state].title}</h3>
      {latest?.note && <p>{latest.note}</p>}
    </section>
  );
}
