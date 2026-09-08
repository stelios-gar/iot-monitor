import { combineDateAndTime, formatDateOnly, formatDateTime, formatFilenameStamp } from './date-format.util';

// All fixture dates below are built from local Y/M/D/H/M/S components (or a
// timezone-less ISO string, which JS parses as local time too) rather than
// a 'Z'-suffixed UTC string, so these assertions hold regardless of the
// machine's timezone.

describe('formatDateTime', () => {
  it('formats a Date as YYYY/MM/DD, HH:MM:SS (24-hour, zero-padded)', () => {
    const date = new Date(2026, 8, 7, 9, 5, 3); // Sep 7 2026, 09:05:03
    expect(formatDateTime(date)).toBe('2026/09/07, 09:05:03');
  });

  it('accepts a timezone-less ISO string, parsed as local time', () => {
    expect(formatDateTime('2026-01-31T23:00:09')).toBe('2026/01/31, 23:00:09');
  });
});

describe('formatDateOnly', () => {
  it('formats a Date as YYYY-MM-DD', () => {
    const date = new Date(2026, 0, 5, 12, 0, 0);
    expect(formatDateOnly(date)).toBe('2026-01-05');
  });
});

describe('formatFilenameStamp', () => {
  it('formats a Date as a dash/underscore-only, filename-safe stamp', () => {
    const date = new Date(2026, 8, 7, 21, 25, 57);
    expect(formatFilenameStamp(date)).toBe('2026-09-07_21-25-57');
  });
});

describe('combineDateAndTime', () => {
  it('returns null when no date is given, regardless of time', () => {
    expect(combineDateAndTime(null, null)).toBeNull();
    expect(combineDateAndTime(null, new Date(2026, 0, 1, 8, 30))).toBeNull();
  });

  it('defaults to the start of the day when time is omitted', () => {
    const date = new Date(2026, 8, 6, 15, 30);
    const result = combineDateAndTime(date, null, 'start-of-day');
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(8);
    expect(result?.getDate()).toBe(6);
    expect(result?.getHours()).toBe(0);
    expect(result?.getMinutes()).toBe(0);
    expect(result?.getSeconds()).toBe(0);
  });

  it('defaults to the end of the day when time is omitted and missingTime is end-of-day', () => {
    const date = new Date(2026, 8, 6);
    const result = combineDateAndTime(date, null, 'end-of-day');
    expect(result?.getHours()).toBe(23);
    expect(result?.getMinutes()).toBe(59);
    expect(result?.getSeconds()).toBe(59);
    expect(result?.getMilliseconds()).toBe(999);
  });

  it("merges the date's day with the time's hours/minutes/seconds", () => {
    const date = new Date(2026, 8, 6, 0, 0, 0);
    const time = new Date(2000, 0, 1, 14, 45, 30);
    const result = combineDateAndTime(date, time);
    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(8);
    expect(result?.getDate()).toBe(6);
    expect(result?.getHours()).toBe(14);
    expect(result?.getMinutes()).toBe(45);
    expect(result?.getSeconds()).toBe(30);
  });
});
