/** Zero-pads a number to at least 2 digits (e.g. 7 -> "07"). */
function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Human-readable timestamp: "YYYY/MM/DD, HH:MM:SS" (24-hour, local time zone).
 * Used where a reading's full date and time should be shown to an end user,
 * as opposed to a machine-parseable format like ISO 8601.
 */
export function formatDateTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const datePart = `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  return `${datePart}, ${timePart}`;
}

/**
 * Human-readable date only, no time: "YYYY-MM-DD" (local time zone). For any
 * value that genuinely has no time component — none of this app's data does
 * today, but kept alongside formatDateTime() as the "date only" half of the
 * same display convention.
 */
export function formatDateOnly(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/**
 * Filesystem-safe timestamp for filenames, e.g. "2026-09-07_21-25-57".
 * Slashes and colons aren't safe in filenames on every OS, so this is a
 * distinct, dash/underscore-only variant rather than the literal
 * formatDateTime() display string.
 */
export function formatFilenameStamp(input: string | Date = new Date()): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  const datePart = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  const timePart = `${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}`;
  return `${datePart}_${timePart}`;
}
