// Simple in-memory rate limiter (per process). For production, replace with Redis-based store.
interface Bucket {
  hits: number;
  resetAt: number;
}

const buckets: Map<string, Bucket> = new Map();

export function rateLimit(key: string, limit = 100, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { hits: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (bucket.hits >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt };
  }
  bucket.hits += 1;
  return { allowed: true, remaining: limit - bucket.hits, resetAt: bucket.resetAt };
}

export function rateLimitResponse(remaining: number, resetAt: number) {
  return {
    'X-RateLimit-Remaining': remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(resetAt / 1000).toString(),
  };
}
