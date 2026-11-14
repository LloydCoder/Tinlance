import { execFileSync } from "node:child_process";

const isProductionMain =
  process.env.VERCEL_ENV === "production" &&
  process.env.VERCEL_GIT_COMMIT_REF === "main";

if (!isProductionMain || process.env.MIGRATE_PRODUCTION !== "true") {
  console.log("Skipping production database migrations outside the explicitly enabled production-main deployment.");
  process.exit(0);
}

const directUrl = process.env.DATABASE_URL_UNPOOLED;
if (!directUrl) {
  throw new Error("DATABASE_URL_UNPOOLED is required for production Prisma migrations.");
}

console.log("Applying pending Prisma migrations to the production database.");
execFileSync("pnpm", ["exec", "prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: directUrl },
});
console.log("Production Prisma migrations completed.");
