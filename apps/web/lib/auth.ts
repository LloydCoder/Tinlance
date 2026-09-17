import { betterAuth } from "better-auth/minimal";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { dash } from "@better-auth/infra";
import { scim } from "@better-auth/scim";
import { sso } from "@better-auth/sso";
import { organization, twoFactor } from "better-auth/plugins";
import { db } from "@/lib/db";

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
const scimCredentialHashSecret = process.env.SCIM_CREDENTIAL_HASH_SECRET;

if (process.env.NODE_ENV === "production" && !scimCredentialHashSecret) {
  throw new Error("SCIM_CREDENTIAL_HASH_SECRET is required in production");
}

const trustedOrigins = [productionOrigin, apexOrigin, baseURL, vercelOrigin]
  .filter((origin): origin is string => Boolean(origin))
  .map((origin) => origin.replace(/\/$/, ""))
  .filter((origin, index, origins) => origins.indexOf(origin) === index);

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
  advanced: {
    database: { joins: true },
    useSecureCookies: process.env.NODE_ENV === "production",
    cookiePrefix: "tinlance",
  },
  baseURL,
  trustedOrigins,
  secret: authSecret,
  appName: "Tinlance",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "viewer", input: false, returned: true },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  account: { encryptOAuthTokens: true },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          if (bootstrapAdminEmail && user.email.toLowerCase() === bootstrapAdminEmail) {
            await db.user.update({ where: { id: user.id }, data: { role: "super-admin" } });
          }
        },
      },
    },
  },
  plugins: [
    organization({
      allowUserToCreateOrganization: true,
      creatorRole: "owner",
      membershipLimit: 100,
      organizationLimit: 20,
      invitationExpiresIn: 60 * 60 * 24 * 7,
      disableOrganizationDeletion: true,
    }),
    twoFactor({
      issuer: "Tinlance",
      skipVerificationOnEnable: false,
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 15 * 60,
      },
    }),
    sso({
      domainVerification: { enabled: true },
      saml: {
        enableInResponseToValidation: true,
        allowIdpInitiated: false,
        requestTTL: 5 * 60 * 1000,
        clockSkew: 60 * 1000,
        requireTimestamps: true,
      },
      organizationProvisioning: {
        disabled: false,
        defaultRole: "member",
      },
    }),
    scim({
      connections: [],
      managedConnections: {
        credentialHashSecret: scimCredentialHashSecret || "ci-only-scim-credential-hash-secret-32-bytes-min",
        maxActiveCredentials: 5,
        lastUsedWriteIntervalSeconds: 300,
      },
    }),
    dash({
      apiKey: betterAuthApiKey,
      managedDirectorySync: {
        enabled: true,
        ssoPairing: true,
        membershipProjection: {
          enabled: true,
          role: "member",
        },
      },
    }),
  ],
});

export type Auth = typeof auth;
