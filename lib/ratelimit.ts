// Free on-device AI rate limit: max N AI calls per user per minute.
// Offline fallbacks never count — only real model calls (ollama/cloud).
const buckets = new Map<string, number[]>();

export function aiRateLimit(userId: string, max = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(userId) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) return false;
  hits.push(now);
  buckets.set(userId, hits);
  return true;
}
