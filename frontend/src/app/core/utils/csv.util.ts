import { EnergyReading } from '../models/energy-reading.model';
import { formatDateTime } from './date-format.util';

const CSV_HEADER = ['Timestamp', 'Voltage (V)', 'Current (mA)', 'Power (mW)', 'Payload (bytes)'];

/**
 * ISO 8601 (e.g. 2026-09-07T18:25:57.000Z) is what analysis tools — Excel,
 * Python/pandas, etc. — parse automatically without being told the format.
 * 'readable' trades that machine-friendliness for a format a person opening
 * the file will find easier to read (YYYY/MM/DD, HH:MM:SS).
 */
export type CsvTimestampFormat = 'iso' | 'readable';

/**
 * Serializes readings to RFC 4180 CSV (CRLF line endings, quoted fields where
 * needed). Numeric values are written at full precision rather than the
 * rounded precision shown in the UI, since an export is meant for further
 * analysis, not display.
 */
export function readingsToCsv(
  readings: readonly EnergyReading[],
  timestampFormat: CsvTimestampFormat = 'iso',
): string {
  const rows = readings.map((r) => {
    const timestamp = timestampFormat === 'readable' ? formatDateTime(r.timestamp) : r.timestamp;
    return [timestamp, r.voltage, r.current, r.power, r.payloadSize].map(csvEscape).join(',');
  });
  return [CSV_HEADER.join(','), ...rows].join('\r\n');
}

function csvEscape(value: string | number): string {
  const str = String(value);
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

/** Triggers a browser download of `content` as a file named `filename`. */
export function downloadTextFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
