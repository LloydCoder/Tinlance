import { NextResponse } from "next/server";
import spec from "../../../../../../docs/api/openapi/v1.json";

export function GET() { return NextResponse.json(spec, { headers: { "cache-control": "public, max-age=300", "content-type": "application/vnd.oai.openapi+json;version=3.1" } }); }
