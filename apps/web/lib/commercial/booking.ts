export function isBookableSlot(date: Date, timezone: string) {
  if (!Number.isFinite(date.getTime())) return false;
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
