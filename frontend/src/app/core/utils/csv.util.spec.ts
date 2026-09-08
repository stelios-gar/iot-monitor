import { vi } from 'vitest';
import { EnergyReading } from '../models/energy-reading.model';
import { downloadTextFile, readingsToCsv } from './csv.util';

const READINGS: EnergyReading[] = [
  { id: 1, timestamp: '2026-09-06T08:00:00.000Z', voltage: 3.9, current: 25.4, power: 99.06, payloadSize: 64 },
  { id: 2, timestamp: '2026-09-06T09:30:00.000Z', voltage: 3.88, current: 280.1, power: 1086.55, payloadSize: 512 },
];

describe('readingsToCsv', () => {
  it('returns just the header row for an empty reading list', () => {
    expect(readingsToCsv([])).toBe('Timestamp,Voltage (V),Current (mA),Power (mW),Payload (bytes)');
  });

  it('writes the ISO 8601 timestamp as-is by default, with CRLF line endings', () => {
    const csv = readingsToCsv(READINGS);
    const lines = csv.split('\r\n');

    expect(lines[0]).toBe('Timestamp,Voltage (V),Current (mA),Power (mW),Payload (bytes)');
    expect(lines[1]).toBe('2026-09-06T08:00:00.000Z,3.9,25.4,99.06,64');
    expect(lines[2]).toBe('2026-09-06T09:30:00.000Z,3.88,280.1,1086.55,512');
  });

  it('formats the timestamp as human-readable, quoting it because it contains a comma', () => {
    const csv = readingsToCsv(READINGS, 'readable');
    const lines = csv.split('\r\n');

    // formatDateTime() renders "YYYY/MM/DD, HH:MM:SS" — the embedded comma
    // means RFC 4180 escaping must wrap the field in quotes.
    expect(lines[1]).toMatch(/^"2026\/09\/06, \d{2}:\d{2}:\d{2}",3\.9,25\.4,99\.06,64$/);
  });
});

describe('downloadTextFile', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates an object URL, clicks a temporary download link, then revokes the URL', () => {
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake-url');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.fn();
    let createdLink: HTMLAnchorElement | undefined;
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      const element = realCreateElement(tagName);
      if (tagName === 'a') {
        createdLink = element as HTMLAnchorElement;
        createdLink.click = clickSpy;
      }
      return element;
    }) as typeof document.createElement);

    downloadTextFile('a,b,c', 'readings.csv', 'text/csv;charset=utf-8;');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:fake-url');
    expect(createdLink?.download).toBe('readings.csv');
    // The link is removed from the DOM again once the download is triggered.
    expect(createdLink?.isConnected).toBe(false);
  });
});
