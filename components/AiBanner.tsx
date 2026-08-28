import { Icon } from "@/components/Icon";

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
      <div role="status" className="flex items-start gap-2 rounded-md border border-amber/50 bg-amber-soft px-3 py-2 text-sm text-ink">
        <Icon name="warning" className="mt-0.5 text-amber" />
        <span>
          <span className="font-semibold text-amber">AI unavailable</span> — showing the rule-based {what} instead. It is safe to use; it may read more mechanically.
        </span>
      </div>
    );
  }
  return (
    <div role="status" className="flex items-center gap-1.5 text-xs text-muted font-mono">
      <Icon name="info" size={14} />
      <span>
        {what[0].toUpperCase() + what.slice(1)} by OpenAI {model ?? "model"}
        {confidence !== undefined && <> · confidence {Math.round(confidence * 100)}%</>}
        {" · "}every conclusion cites its source row
      </span>
    </div>
  );
}
