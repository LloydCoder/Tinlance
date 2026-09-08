import { NextResponse } from "next/server";
import { API_VERSION } from "@/lib/api/v1";
import { getRequestId } from "@/lib/security/request-id";

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  return NextResponse.json({ apiVersion: API_VERSION, status: "stable", openapi: "/docs/api/openapi/v1.json", documentation: "/docs/api", requestId }, { headers: { "cache-control": "public, max-age=300", "x-request-id": requestId } });
}
