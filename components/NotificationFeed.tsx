import type { Notification } from "@/lib/claims";
import type { Lang } from "./LangTabs";

const LANG_CLASS: Record<Lang, string> = { en: "", kn: "lang-kn", hi: "lang-hi" };

/** SMS-style feed — what the citizen's phone would receive at each step. Newest first. */
export function NotificationFeed({
  items,
  lang,
  panelId,
  tabId,
}: {
  items: Notification[];
  lang: Lang;
  panelId?: string;
  tabId?: string;
}) {
  const content = !items.length ? <p className="text-sm text-muted">No messages yet.</p> : (
    <ul className="space-y-2">
      {[...items].reverse().map((n, i) => (
        <li key={i} className="max-w-[92%] rounded-lg rounded-tl-sm bg-card border border-line px-3 py-2 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
          <p className={`text-[15px] leading-snug ${LANG_CLASS[lang]}`}>{n.text[lang]}</p>
          <p className="mt-1 text-[11px] font-mono text-muted">
            SMS · {new Date(n.at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </li>
      ))}
    </ul>
  );

  if (!panelId) return content;

  return <section id={panelId} role="tabpanel" aria-labelledby={tabId}>{content}</section>;
}
