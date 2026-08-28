/** Tells the citizen, every time, whether the model or the rules produced what they see. */
export function AiBanner({
  source,
  model,
  confidence,
  what = "result",
}: {
  source: "openai" | "fallback";
  model?: string;
  confidence?: number;
  what?: string;
}) {
  if (source === "fallback") {
    return (
      <div role="status" className="rounded-md border border-amber/50 bg-amber-soft px-3 py-2 text-sm text-ink">
        <span className="font-semibold text-amber">AI unavailable</span> — showing the rule-based {what} instead. It is safe to use; it may read more mechanically.
      </div>
    );
  }
  return (
    <div role="status" className="text-xs text-muted font-mono">
      {what[0].toUpperCase() + what.slice(1)} by OpenAI {model ?? "model"}
      {confidence !== undefined && <> · confidence {Math.round(confidence * 100)}%</>}
      {" · "}every conclusion cites its source row
    </div>
  );
}
