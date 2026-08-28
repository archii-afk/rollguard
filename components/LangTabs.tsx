export type Lang = "en" | "kn" | "hi";

const TABS: { value: Lang; label: string; cls: string }[] = [
  { value: "en", label: "English", cls: "" },
  { value: "kn", label: "ಕನ್ನಡ", cls: "lang-kn" },
  { value: "hi", label: "हिन्दी", cls: "lang-hi" },
];

export function LangTabs({ value, onChange }: { value: Lang; onChange: (l: Lang) => void }) {
  return (
    <div role="tablist" aria-label="Form language" className="inline-flex rounded-md border border-line bg-card p-0.5">
      {TABS.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          aria-controls="form-language-panel"
          onClick={() => onChange(t.value)}
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
