"use client";

import { createAuthClient } from "better-auth/react";
import { organizationClient, twoFactorClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [organizationClient(), twoFactorClient({ twoFactorPage: "/two-factor" })],
});

export const { signIn, signUp, signOut, useSession } = authClient;
