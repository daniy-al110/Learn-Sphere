/** Time helpers for the open-enrollment window (all in Pakistan Standard Time, UTC+5). */

/** "2026-10-03T14:30" (PKT, from <input type=datetime-local>) -> ISO string, or "" when invalid. */
export function toPkIso(datetimeLocalValue: string): string {
  if (!datetimeLocalValue) return "";
  const parsed = new Date(`${datetimeLocalValue}:00+05:00`);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString();
}

/** ISO string -> value for <input type=datetime-local> in PKT. */
export function fromIsoToDatetimeLocal(isoValue?: string | null): string {
  if (!isoValue) return "";
  try {
    const parts = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "Asia/Karachi",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
      .formatToParts(new Date(isoValue))
      .reduce<Record<string, string>>((acc, part) => {
        if (part.type !== "literal") acc[part.type] = part.value;
        return acc;
      }, {});
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
  } catch {
    return "";
  }
}

export function getDefaultSemester(): string {
  const now = new Date();
  return `${now.getMonth() < 6 ? "Spring" : "Fall"} ${now.getFullYear()}`;
}

export function getDefaultDueDate(): string {
  return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}
