import { z } from "zod";

const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  BETTER_AUTH_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_API_KEY: z.string().min(1).optional(),
  TINLANCE_BOOTSTRAP_ADMIN_EMAIL: z.string().email().optional(),
  DATABASE_URL: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  PAYSTACK_SECRET_KEY: z.string().min(1).optional(),
});

export const env = baseEnvSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
  BETTER_AUTH_API_KEY: process.env.BETTER_AUTH_API_KEY,
  TINLANCE_BOOTSTRAP_ADMIN_EMAIL: process.env.TINLANCE_BOOTSTRAP_ADMIN_EMAIL,
  DATABASE_URL: process.env.DATABASE_URL,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
});

export function validateProductionEnv(options?: { billing?: boolean }) {
  if (env.NODE_ENV !== "production") return;

  const required: Record<string, string | undefined> = {
    DATABASE_URL: env.DATABASE_URL,
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    BETTER_AUTH_URL: env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
    UPSTASH_REDIS_REST_URL: env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: env.UPSTASH_REDIS_REST_TOKEN,
  };

  if (options?.billing) {
    required.PAYSTACK_SECRET_KEY = env.PAYSTACK_SECRET_KEY;
  }

  const missing = Object.entries(required)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`,
    );
  }

  if ((env.BETTER_AUTH_SECRET?.length ?? 0) < 32) {
    throw new Error("Better Auth signing secret must contain at least 32 characters");
  }

  if (env.BETTER_AUTH_URL !== env.NEXT_PUBLIC_APP_URL) {
    throw new Error(
      "BETTER_AUTH_URL and NEXT_PUBLIC_APP_URL must match in production",
    );
  }
}
