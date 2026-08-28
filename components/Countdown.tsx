/** Days left until a deadline, computed in IST end-of-day. */
export function daysLeft(untilISODate: string, now = new Date()): number {
  const end = new Date(`${untilISODate}T23:59:59+05:30`).getTime();
  return Math.ceil((end - now.getTime()) / 86_400_000);
}

export function Countdown({ until, label = "to file a claim" }: { until: string; label?: string }) {
  const d = daysLeft(until);
  const urgent = d <= 7;
  const pretty = new Date(`${until}T00:00:00+05:30`).toLocaleDateString("en-IN", { day: "numeric", month: "long" });
  if (d < 0) {
    return <p className="text-sm text-stamp font-medium">The window closed on {pretty}.</p>;
  }
  return (
    <p className={`text-sm ${urgent ? "text-stamp" : "text-ink"}`}>
      <span className="font-display font-bold text-2xl leading-none align-baseline">{d}</span>{" "}
      <span className="font-medium">{d === 1 ? "day" : "days"}</span> left {label} · until {pretty}
    </p>
  );
}
