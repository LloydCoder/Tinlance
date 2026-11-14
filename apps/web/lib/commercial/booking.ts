export function isBookableSlot(date: Date, timezone: string, now = new Date()) {
  if (!Number.isFinite(date.getTime()) || date.getTime() <= now.getTime() + 60 * 60 * 1000 || date.getUTCSeconds() !== 0 || date.getUTCMilliseconds() !== 0) return false;
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone, weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(date);
    const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    const weekday = values.weekday;
    const hour = Number(values.hour);
    const minute = Number(values.minute);
    return weekday !== "Sat" && weekday !== "Sun" && hour >= 9 && hour < 17 && minute % 30 === 0;
  } catch {
    return false;
  }
}
export function nextLocalHalfHour(from: Date, timezone: string) {
  const cursor = new Date(from);
  cursor.setUTCSeconds(0, 0);
  if (cursor.getTime() <= from.getTime()) cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);

  const formatter = new Intl.DateTimeFormat("en-US", { timeZone: timezone, minute: "2-digit" });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const minute = Number(formatter.formatToParts(cursor).find((part) => part.type === "minute")?.value);
    if (Number.isInteger(minute) && minute % 30 === 0) return cursor;
    cursor.setUTCMinutes(cursor.getUTCMinutes() + 1);
  }
  throw new RangeError("unable_to_align_booking_slot");
}
