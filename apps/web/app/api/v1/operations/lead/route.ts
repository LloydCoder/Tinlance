import { NextResponse } from "next/server";
import { leadSchema } from "@/lib/operations/contracts";
import { getRequestId } from "@/lib/security/request-id";

const MAX_BODY_BYTES = 16_384;

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const bodyText = await request.text();

  if (new TextEncoder().encode(bodyText).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: "payload_too_large", requestId },
      {
        status: 413,
        headers: {
          "cache-control": "no-store",
          "x-request-id": requestId,
        },
      },
    );
  }

  const body = (() => {
    try {
      return JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      return null;
    }
  })();

  if (!body) {
    return NextResponse.json(
      { error: "invalid_json", requestId },
      {
        status: 400,
        headers: {
          "cache-control": "no-store",
          "x-request-id": requestId,
        },
      },
    );
  }

  if (typeof body.website === "string" && body.website.trim().length > 0) {
    return NextResponse.json(
      { status: "accepted", requestId },
      {
        status: 202,
        headers: {
          "cache-control": "no-store",
          "x-request-id": requestId,
        },
      },
    );
  }

  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_request", requestId },
      {
        status: 400,
        headers: {
          "cache-control": "no-store",
          "x-request-id": requestId,
        },
      },
    );
  }

  return NextResponse.json(
    { status: "accepted", requestId, nextStep: "lead_review" },
    {
      status: 202,
      headers: {
        "cache-control": "no-store",
        "x-request-id": requestId,
      },
    },
  );
}
