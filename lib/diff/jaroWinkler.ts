export function jaroWinkler(a: string, b: string): number {
  if (a === b) return 1;
  if (!a.length || !b.length) return 0;

  const window = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);
  let matches = 0;

  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - window);
    const end = Math.min(i + window + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }

  if (!matches) return 0;

  const matchedA: string[] = [];
  const matchedB: string[] = [];
  for (let i = 0; i < a.length; i++) if (aMatches[i]) matchedA.push(a[i]);
  for (let i = 0; i < b.length; i++) if (bMatches[i]) matchedB.push(b[i]);
  let transpositions = 0;
  for (let i = 0; i < matchedA.length; i++) {
    if (matchedA[i] !== matchedB[i]) transpositions++;
  }
  transpositions /= 2;

  const jaro = (
    matches / a.length +
    matches / b.length +
    (matches - transpositions) / matches
  ) / 3;
  let prefix = 0;
  while (prefix < Math.min(4, a.length, b.length) && a[prefix] === b[prefix]) prefix++;
  return jaro + prefix * 0.1 * (1 - jaro);
}
