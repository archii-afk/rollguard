import { useRef } from "react";

export type Lang = "en" | "kn" | "hi";

const TABS: { value: Lang; label: string; cls: string }[] = [
  { value: "en", label: "English", cls: "" },
  { value: "kn", label: "ಕನ್ನಡ", cls: "lang-kn" },
  { value: "hi", label: "हिन्दी", cls: "lang-hi" },
];

export function tabIdForLanguage(panelId: string, language: Lang) {
  return `${panelId}-${language}-tab`;
}

export function nextLanguageForKey(current: Lang, key: string): Lang | null {
  const currentIndex = TABS.findIndex((tab) => tab.value === current);
  if (key === "Home") return TABS[0].value;
  if (key === "End") return TABS.at(-1)?.value ?? null;
  if (key === "ArrowRight") return TABS[(currentIndex + 1) % TABS.length].value;
  if (key === "ArrowLeft") return TABS[(currentIndex - 1 + TABS.length) % TABS.length].value;
  return null;
}

export function LangTabs({
  value,
  onChange,
  panelId,
  label = "Language",
}: {
  value: Lang;
  onChange: (l: Lang) => void;
  panelId?: string;
  label?: string;
}) {
  const tabRefs = useRef<Partial<Record<Lang, HTMLButtonElement | null>>>({});

  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-md border border-line bg-card p-0.5">
      {TABS.map((t) => (
        <button
          key={t.value}
          ref={(node) => { tabRefs.current[t.value] = node; }}
          id={panelId ? tabIdForLanguage(panelId, t.value) : undefined}
          role="tab"
          aria-selected={value === t.value}
          aria-controls={panelId}
          tabIndex={value === t.value ? 0 : -1}
          onClick={() => onChange(t.value)}
          onKeyDown={(event) => {
            const next = nextLanguageForKey(t.value, event.key);
            if (!next) return;
            event.preventDefault();
            onChange(next);
            tabRefs.current[next]?.focus();
          }}
          className={`pressable min-h-[44px] min-w-[72px] rounded px-3 text-sm font-medium ${t.cls} ${
            value === t.value ? "bg-violet text-white" : "text-ink hover:bg-paper"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
