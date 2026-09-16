/**
 * Return the calendar day represented by a habit date.
 *
 * Habit entries are stored as a calendar day and the API serializes them as
 * an ISO timestamp. Reading that timestamp through the device timezone can
 * move a midnight UTC value to the previous day (for example in Toronto).
 * Preserve the serialized date portion, while Date objects from the date
 * picker use their local calendar fields.
 */
export function habitDateKey(value: string | Date): string {
  if (typeof value === 'string') {
    const dateOnly = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
    if (dateOnly) return dateOnly;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const pad = (part: number) => String(part).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
