import { Redis } from "@upstash/redis";

const WINDOW_SECONDS = 60;
const LIMITS = { read: 120, write: 60, expensive: 5 } as const;
export type ApiRateClass = keyof typeof LIMITS;
let redis: Redis | null = null;
function getRedis() { if (redis) return redis; const url = process.env.UPSTASH_REDIS_REST_URL; const token = process.env.UPSTASH_REDIS_REST_TOKEN; if (!url || !token) return null; redis = new Redis({ url, token }); return redis; }

export async function enforcePublicRateLimit(key: string, rateClass: ApiRateClass = "read") {
  const client = getRedis(); const max = LIMITS[rateClass];
  if (!client) { if (process.env.NODE_ENV === "production") throw new Error("Public API rate limiting is not configured"); return { allowed: true, remaining: max, retryAfter: WINDOW_SECONDS, limit: max }; }
  const bucket = `tinlance:ratelimit:v1:${rateClass}:${key}`; const count = await client.incr(bucket); if (count === 1) await client.expire(bucket, WINDOW_SECONDS);
  return { allowed: count <= max, remaining: Math.max(0, max - count), retryAfter: WINDOW_SECONDS, limit: max };
}
