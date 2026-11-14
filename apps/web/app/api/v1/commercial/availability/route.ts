import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";
import { isBookableSlot, nextLocalHalfHour } from "@/lib/commercial/booking";

const SLOT_MINUTES = 30;
const DAYS = 14;

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const timezone = new URL(request.url).searchParams.get("timezone")?.trim() || "UTC";
  try { new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format(); } catch { return NextResponse.json({ error: "invalid_timezone", requestId }, { status: 400, headers: { "cache-control": "no-store", "x-request-id": requestId } }); }
  const from = new Date();
  const until = new Date(from.getTime() + DAYS * 24 * 60 * 60 * 1000);
  const bookings = await db.booking.findMany({ where: { startsAt: { gte: from, lt: until }, status: { in: ["requested", "confirmed"] } }, select: { startsAt: true } });
  const occupied = new Set(bookings.map((booking) => booking.startsAt.getTime()));
  const slots: string[] = [];
  const cursor = nextLocalHalfHour(from, timezone);
  while (cursor < until && slots.length < 100) {
    if (isBookableSlot(cursor, timezone, from) && !occupied.has(cursor.getTime())) slots.push(cursor.toISOString());
    cursor.setUTCMinutes(cursor.getUTCMinutes() + SLOT_MINUTES);
  }
  return NextResponse.json({ timezone, slots }, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
