import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { dash } from "@better-auth/infra";
import { organization, twoFactor } from "better-auth/plugins";
import { db } from "@/lib/db";

// Vercel currently serves the Tinlance project on the www hostname. Keep the
// auth base URL aligned with the actual production origin so Better Auth does
// not have to reconcile two competing canonical hosts during origin checks.
const productionOrigin = "https://www.tinlance.com";
const apexOrigin = "https://tinlance.com";
const vercelOrigin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const configuredBaseURL = process.env.BETTER_AUTH_URL?.trim().replace(/\/$/, "");
const baseURL = process.env.NODE_ENV === "production"
  ? productionOrigin
  : (configuredBaseURL || vercelOrigin || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
const bootstrapAdminEmail = process.env.TINLANCE_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
const authSecret = process.env.BETTER_AUTH_SECRET;
const betterAuthApiKey = process.env.BETTER_AUTH_API_KEY;

// The apex hostname is still trusted because it may be used before/after the
// Vercel domain redirect. The browser-facing production origin remains www.
const trustedOrigins = [productionOrigin, apexOrigin, baseURL, vercelOrigin]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => origin.replace(/\/$/, ""))
  .filter((origin, index, origins) => origins.indexOf(origin) === index);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  advanced: { database: { joins: true }, useSecureCookies: process.env.NODE_ENV === "production", cookiePrefix: "tinlance" },
  baseURL,
  trustedOrigins,
  secret: authSecret,
  emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128, revokeSessionsOnPasswordReset: true },
  user: { additionalFields: { role: { type: "string", required: false, defaultValue: "viewer", input: false, returned: true } } },
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24, cookieCache: { enabled: true, maxAge: 60 * 5 } },
  account: { encryptOAuthTokens: true },
  databaseHooks: { user: { create: { after: async (user) => { if (bootstrapAdminEmail && user.email.toLowerCase() === bootstrapAdminEmail) await db.user.update({ where: { id: user.id }, data: { role: "super-admin" } }); } } } },
  plugins: [
    organization({ allowUserToCreateOrganization: true, creatorRole: "owner", membershipLimit: 100, organizationLimit: 20, invitationExpiresIn: 60 * 60 * 24 * 7, disableOrganizationDeletion: true }),
    twoFactor({ issuer: "Tinlance" }),
    dash({ apiKey: betterAuthApiKey }),
  ],
});

export type Auth = typeof auth;
