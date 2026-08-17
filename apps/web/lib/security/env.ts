import { z } from "zod";

const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  CLERK_SECRET_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1).optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
});

export const env = baseEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
});

export function validateProductionEnv(options?: { billing?: boolean }) {
  if (env.NODE_ENV !== "production") return;

  const required: Record<string, string | undefined> = {
    DATABASE_URL: env.DATABASE_URL,
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
    CLERK_SECRET_KEY: env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  };

  if (options?.billing) required.PAYSTACK_SECRET_KEY = env.PAYSTACK_SECRET_KEY;

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }
}
