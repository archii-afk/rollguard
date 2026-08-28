export function QueueSummary({ total, dueSoon, groups }: { total: number; dueSoon: number; groups: number }) {
  return (
    <dl className="queue-summary" aria-label="Queue summary">
      <div>
        <dt>Total claims</dt>
        <dd className="nums">{total}</dd>
      </div>
      <div>
        <dt>Awaiting field visit</dt>
        <dd className="nums">{dueSoon}</dd>
      </div>
      <div>
        <dt>Active stages</dt>
        <dd className="nums">{groups}</dd>
      </div>
    </dl>
  );
}
