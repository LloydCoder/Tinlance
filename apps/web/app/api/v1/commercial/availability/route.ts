import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getRequestId } from "@/lib/security/request-id";

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
  const cursor = new Date(from);
  cursor.setUTCSeconds(0, 0);
  cursor.setUTCMinutes(Math.ceil(cursor.getUTCMinutes() / SLOT_MINUTES) * SLOT_MINUTES);
  while (cursor < until && slots.length < 100) {
    const weekday = cursor.getUTCDay();
    const hour = cursor.getUTCHours();
    if (weekday !== 0 && weekday !== 6 && hour >= 9 && hour < 17 && !occupied.has(cursor.getTime()) && cursor.getTime() > Date.now() + 60 * 60 * 1000) slots.push(cursor.toISOString());
    cursor.setUTCMinutes(cursor.getUTCMinutes() + SLOT_MINUTES);
  }
  return NextResponse.json({ timezone, slots }, { headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
