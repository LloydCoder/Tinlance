import { NextResponse } from "next/server";
import { assessmentBookingSchema } from "@/lib/operations/contracts";
import { getRequestId } from "@/lib/security/request-id";

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const body = await request.json().catch(() => null);
  const parsed = assessmentBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", requestId },
      { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } },
    );
  }

  return NextResponse.json(
    { status: "accepted", requestId, nextStep: "assessment_confirmation" },
    { status: 202, headers: { "cache-control": "no-store", "x-request-id": requestId } },
  );
}
