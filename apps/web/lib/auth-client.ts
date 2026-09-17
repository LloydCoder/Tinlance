"use client";

import { createAuthClient } from "better-auth/react";
import {
  organizationClient,
  ssoClient,
  twoFactorClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    organizationClient(),
    twoFactorClient({
      twoFactorPage: "/two-factor",
    }),
    ssoClient({
      domainVerification: {
        enabled: true,
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
