/**
 * The app's whole icon set: five outline glyphs, 1.5 px stroke, 24-unit grid (Phosphor-style).
 * Inline so nothing is downloaded. Decorative by default (aria-hidden); pass `label` when the
 * icon carries meaning on its own.
 */
const PATHS = {
  check: "M5 12.5l4.5 4.5L19 7.5",
  "arrow-right": "M4 12h15m-6-6l6 6-6 6",
  "chevron-right": "M9 5l7 7-7 7",
  warning: "M12 4.5 2.75 20h18.5L12 4.5Zm0 6v4.5m0 3v.5",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v5m0-8.5v.5",
  home: "M4 11.5 12 5l8 6.5V20h-5.5v-5h-5v5H4v-8.5Z",
  paper: "M7 3h7l5 5v13H7V3Zm7 0v5h5M9.5 12h5m-5 4h5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 18,
  className = "",
  label,
}: {
  name: IconName;
  size?: number;
  className?: string;
  label?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      aria-hidden={label ? undefined : true}
      role={label ? "img" : undefined}
      aria-label={label}
      focusable="false"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
