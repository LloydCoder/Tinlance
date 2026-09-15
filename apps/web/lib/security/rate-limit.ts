import { Redis } from "@upstash/redis";

const WINDOW_SECONDS = 60;
const LIMITS = { read: 120, write: 60, expensive: 5 } as const;
const FALLBACK_MAX_KEYS = 10_000;

type LocalBucket = { count: number; expiresAt: number };

export type ApiRateClass = keyof typeof LIMITS;

let redis: Redis | null = null;
const localBuckets = new Map<string, LocalBucket>();

function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

function enforceLocalRateLimit(key: string, rateClass: ApiRateClass) {
  const now = Date.now();
  const max = LIMITS[rateClass];
  const bucketKey = `${rateClass}:${key}`;
  const existing = localBuckets.get(bucketKey);

  if (localBuckets.size > FALLBACK_MAX_KEYS) {
    for (const [candidateKey, bucket] of localBuckets) {
      if (bucket.expiresAt <= now) localBuckets.delete(candidateKey);
      if (localBuckets.size <= FALLBACK_MAX_KEYS) break;
    }
  }

  if (!existing || existing.expiresAt <= now) {
    localBuckets.set(bucketKey, {
      count: 1,
      expiresAt: now + WINDOW_SECONDS * 1000,
    });
    return {
      allowed: true,
      remaining: max - 1,
      retryAfter: WINDOW_SECONDS,
      limit: max,
    };
  }

  existing.count += 1;
  return {
    allowed: existing.count <= max,
    remaining: Math.max(0, max - existing.count),
    retryAfter: Math.max(1, Math.ceil((existing.expiresAt - now) / 1000)),
    limit: max,
  };
}

export async function enforcePublicRateLimit(
  key: string,
  rateClass: ApiRateClass = "read",
) {
  const client = getRedis();
  const max = LIMITS[rateClass];

  if (!client) {
    // Production must remain available if the optional distributed limiter is
    // temporarily unavailable. The bounded process-local limiter still
    // protects each warm instance; Redis remains the preferred distributed
    // limiter whenever its credentials are configured.
    return enforceLocalRateLimit(key, rateClass);
  }

  try {
    const bucket = `tinlance:ratelimit:v1:${rateClass}:${key}`;
    const count = await client.incr(bucket);
    if (count === 1) await client.expire(bucket, WINDOW_SECONDS);
    return {
      allowed: count <= max,
      remaining: Math.max(0, max - count),
      retryAfter: WINDOW_SECONDS,
      limit: max,
    };
  } catch (error) {
    console.warn("public_rate_limit_degraded", {
      rateClass,
      reason: error instanceof Error ? error.message : "unknown",
    });
    return enforceLocalRateLimit(key, rateClass);
  }
}
