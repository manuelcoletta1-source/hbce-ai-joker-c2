export function mergeUniqueMatches(coreMatches = [], alienMatches = [], limit = 5) {
  const combined = [...coreMatches, ...alienMatches];
  const unique = [];
  const seen = new Set();

  for (const item of combined) {
    const key = `${item.layer}:${item.entry.id}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  }

  return unique.slice(0, limit);
}
