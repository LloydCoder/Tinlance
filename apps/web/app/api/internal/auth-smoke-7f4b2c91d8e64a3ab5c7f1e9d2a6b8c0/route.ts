import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const email = `auth-smoke-${Date.now()}@tinlance.com`;
  const password = "TinlanceSmoke123!";
  const origin = new URL(request.url).origin;

  try {
    const response = await auth.handler(
      new Request("https://www.tinlance.com/api/auth/sign-up/email", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          origin,
          "x-forwarded-host": "www.tinlance.com",
          "x-forwarded-proto": "https",
        },
        body: JSON.stringify({ name: "Tinlance Production Smoke Test", email, password }),
      }),
    );

    const text = await response.text();
    let parsed: unknown = text;
    try { parsed = JSON.parse(text); } catch {}

    const createdUser = await db.user.findUnique({ where: { email } });
    if (createdUser) await db.user.delete({ where: { id: createdUser.id } });

    return Response.json({ ok: response.ok, status: response.status, response: parsed, cleanup: !createdUser || "deleted" }, { status: response.ok ? 200 : 500 });
  } catch (error) {
    await db.user.deleteMany({ where: { email } });
    return Response.json({ ok: false, error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
