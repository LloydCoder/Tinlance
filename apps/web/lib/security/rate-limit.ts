import { Redis } from "@upstash/redis";

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 8;

let redis: Redis | null = null;

function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

export async function enforcePublicRateLimit(key: string) {
  const client = getRedis();
  if (!client) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Public API rate limiting is not configured");
    }
    return { allowed: true, remaining: MAX_REQUESTS };
  }

  const bucket = `tinlance:ratelimit:${key}`;
  const count = await client.incr(bucket);
  if (count === 1) await client.expire(bucket, WINDOW_SECONDS);

  return {
    allowed: count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - count),
    retryAfter: WINDOW_SECONDS,
  };
}
