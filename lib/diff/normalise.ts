const ABBREV: Record<string, string> = { md: "mohammed", mohd: "mohammed", mohammad: "mohammed", muhammad: "mohammed", sk: "sheikh", shaik: "sheikh" };
const DROP = new Set(["smt", "sri", "shri", "kum", "mr", "mrs", "ms", "dr"]);

export function normaliseName(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean)
    .filter(t => !DROP.has(t)).map(t => ABBREV[t] ?? t).join(" ");
}
