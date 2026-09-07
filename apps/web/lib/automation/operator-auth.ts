import { headers } from "next/headers";
import { auth } from "@/lib/auth";

export async function requireAutomationOperator() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !["admin", "super-admin"].includes(session.user.role ?? "")) return null;
  return { userId: session.user.id, globalRole: session.user.role };
}
