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

/**
 * Merges a calendar date (day/month/year) with a time-of-day (hours/minutes/
 * seconds), since the History page's From/To filters use a separate
 * `mat-datepicker` and `mat-timepicker` rather than one combined control.
 *
 * `date` provides the day; `time` provides the hours/minutes/seconds, if
 * set. With no date, there's nothing to filter on, so this returns `null`
 * regardless of `time`. With a date but no time, `missingTime` decides
 * whether the resulting instant sits at the very start of that day
 * (`'start-of-day'`, the default — used for the "From" filter) or the very
 * end of it (`'end-of-day'` — used for the "To" filter, so picking only a
 * date includes every reading recorded on that day).
 */
export function combineDateAndTime(
  date: Date | null,
  time: Date | null,
  missingTime: 'start-of-day' | 'end-of-day' = 'start-of-day',
): Date | null {
  if (!date) {
    return null;
  }

  const combined = new Date(date);
  if (time) {
    combined.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), 0);
  } else if (missingTime === 'end-of-day') {
    combined.setHours(23, 59, 59, 999);
  } else {
    combined.setHours(0, 0, 0, 0);
  }
  return combined;
}
