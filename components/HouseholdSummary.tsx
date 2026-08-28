export function HouseholdSummary({
  total,
  action,
  confirm,
  fresh,
  correct,
}: {
  total: number;
  action: number;
  confirm: number;
  fresh: number;
  correct: number;
}) {
  const items = [
    ["Members", total],
    ["Need action", action],
    ["Need confirmation", confirm],
    ["New voter", fresh],
    ["Looks right", correct],
  ] as const;

  return (
    <dl className="household-summary">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
