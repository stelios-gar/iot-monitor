import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { vi } from 'vitest';
import { EnergyReading, ConnectionStatus } from '../../core/models/energy-reading.model';
import { RealtimeService } from '../../core/services/realtime.service';
import { HistoryComponent } from './history.component';

/** Stands in for RealtimeService so no real STOMP/SockJS connection is opened. */
class FakeRealtimeService {
  readonly status = signal<ConnectionStatus>('idle');
  connect(): void {}
  disconnect(): void {}
}

const READINGS: EnergyReading[] = [
  { id: 1, timestamp: '2026-09-05T23:59:00', voltage: 3.9, current: 25, power: 97.5, payloadSize: 64 },
  { id: 2, timestamp: '2026-09-06T08:00:00', voltage: 3.9, current: 25, power: 97.5, payloadSize: 64 },
  { id: 3, timestamp: '2026-09-06T23:59:59', voltage: 3.9, current: 25, power: 97.5, payloadSize: 64 },
  { id: 4, timestamp: '2026-09-07T00:00:01', voltage: 3.9, current: 25, power: 97.5, payloadSize: 64 },
];

describe('HistoryComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HistoryComponent],
      providers: [
        provideHttpClient(),
        provideNativeDateAdapter(),
        provideNoopAnimations(),
        provideCharts(withDefaultRegisterables()),
        { provide: RealtimeService, useClass: FakeRealtimeService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('filters readings by the combined date+time range, defaulting missing time to day boundaries', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    const component = fixture.componentInstance as any;
    component.allReadings.set(READINGS);

    // No filters set: everything passes through.
    expect(component.filteredReadings()).toEqual(READINGS);

    // "From" date only -> includes the whole day of the 6th onward.
    component.onFromDateChange(new Date(2026, 8, 6));
    expect(component.filteredReadings().map((r: EnergyReading) => r.id)).toEqual([2, 3, 4]);

    // Adding a "To" date only -> includes the whole day of the 6th, so the 7th drops out.
    component.onToDateChange(new Date(2026, 8, 6));
    expect(component.filteredReadings().map((r: EnergyReading) => r.id)).toEqual([2, 3]);

    // Narrowing "From" with a time excludes the reading right at day-start on the 6th.
    component.onFromTimeChange(new Date(2000, 0, 1, 8, 0, 1));
    expect(component.filteredReadings().map((r: EnergyReading) => r.id)).toEqual([3]);
  });

  it('clearFilters resets all four date/time signals', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    const component = fixture.componentInstance as any;

    component.onFromDateChange(new Date());
    component.onFromTimeChange(new Date());
    component.onToDateChange(new Date());
    component.onToTimeChange(new Date());

    component.clearFilters();

    expect(component.fromDate()).toBeNull();
    expect(component.fromTime()).toBeNull();
    expect(component.toDate()).toBeNull();
    expect(component.toTime()).toBeNull();
  });

  it('does not touch the download machinery when there are no filtered readings to export', () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    const component = fixture.componentInstance as any;
    component.allReadings.set([]);
    const createObjectURL = vi.spyOn(URL, 'createObjectURL');

    component.exportCsv('iso');

    expect(createObjectURL).not.toHaveBeenCalled();
  });

  it('exports the filtered readings as CSV, named for the chosen timestamp format', async () => {
    const fixture = TestBed.createComponent(HistoryComponent);
    const component = fixture.componentInstance as any;
    component.allReadings.set(READINGS);

    let capturedBlob: Blob | undefined;
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockImplementation((blob: unknown) => {
      capturedBlob = blob as Blob;
      return 'blob:fake-url';
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    let createdLink: HTMLAnchorElement | undefined;
    const realCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      const element = realCreateElement(tagName);
      if (tagName === 'a') {
        createdLink = element as HTMLAnchorElement;
        createdLink.click = vi.fn();
      }
      return element;
    }) as typeof document.createElement);

    component.exportCsv('readable');

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(createdLink?.download).toMatch(/^energy-readings-readable-.+\.csv$/);
    expect(capturedBlob?.type).toBe('text/csv;charset=utf-8;');

    const content = await capturedBlob!.text();
    expect(content).toContain('Timestamp,Voltage (V),Current (mA),Power (mW),Payload (bytes)');
    // formatDateTime() renders a comma, so the readable timestamp column
    // should come back RFC-4180-quoted, same as in csv.util.spec.ts.
    expect(content).toMatch(/"2026\/09\/05, 23:59:00"/);
  });
});
