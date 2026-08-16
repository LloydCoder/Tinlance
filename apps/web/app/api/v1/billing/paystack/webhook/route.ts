import { NextResponse } from "next/server";
import { verifyPaystackSignature } from "@/lib/operations/paystack";
import { getRequestId } from "@/lib/security/request-id";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const payload = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const secret = process.env.PAYSTACK_SECRET_KEY ?? "";

  if (!verifyPaystackSignature(payload, signature, secret)) {
    return NextResponse.json(
      { error: "invalid_signature", requestId },
      { status: 401, headers: { "cache-control": "no-store", "x-request-id": requestId } },
    );
  }

  return NextResponse.json(
    { received: true, requestId },
    { headers: { "cache-control": "no-store", "x-request-id": requestId } },
  );
}
