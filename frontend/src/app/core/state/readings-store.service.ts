import { Injectable, computed, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { ConnectionStatus, DataMode, EnergyReading } from '../models/energy-reading.model';
import { MockDataService } from '../services/mock-data.service';
import { RealtimeService } from '../services/realtime.service';

const LIVE_BUFFER_SIZE = 200;
const MOCK_PERIOD_MS = 1000;

/**
 * App-wide source of truth for the live reading stream.
 *
 * Wraps whichever data source is active — the real backend over WebSocket,
 * or the synthetic MockDataService — behind a single `mode` switch, so
 * feature pages (dashboard, history) don't need to know which one is live.
 */
@Injectable({ providedIn: 'root' })
export class ReadingsStoreService {
  private readonly realtime = inject(RealtimeService);
  private readonly mock = inject(MockDataService);

  private mockSubscription: Subscription | null = null;

  private readonly _mode = signal<DataMode>('mock');
  private readonly _liveReadings = signal<EnergyReading[]>([]);

  /** Current data source. Defaults to 'mock' so the UI works before the RP2350/backend are wired up. */
  readonly mode = this._mode.asReadonly();

  /** Rolling buffer of the most recent readings (capped at LIVE_BUFFER_SIZE). */
  readonly liveReadings = this._liveReadings.asReadonly();

  readonly latest = computed<EnergyReading | null>(() => {
    const readings = this._liveReadings();
    return readings.length ? readings[readings.length - 1] : null;
  });

  /** In mock mode the "connection" is always considered up. */
  readonly connectionStatus = computed<ConnectionStatus>(() =>
    this._mode() === 'mock' ? 'connected' : this.realtime.status(),
  );

  constructor() {
    this.startSource('mock');
  }

  setMode(mode: DataMode): void {
    if (this._mode() === mode) {
      return;
    }
    this._liveReadings.set([]);
    this.startSource(mode);
  }

  private startSource(mode: DataMode): void {
    this.stopCurrentSource();
    this._mode.set(mode);

    if (mode === 'live') {
      this.realtime.connect((batch) => this.appendReadings(batch));
    } else {
      this.mockSubscription = this.mock
        .liveStream(MOCK_PERIOD_MS)
        .subscribe((reading) => this.appendReadings([reading]));
    }
  }

  private stopCurrentSource(): void {
    this.realtime.disconnect();
    this.mockSubscription?.unsubscribe();
    this.mockSubscription = null;
  }

  private appendReadings(batch: EnergyReading[]): void {
    if (!batch.length) {
      return;
    }
    this._liveReadings.update((current) => {
      const next = [...current, ...batch];
      return next.length > LIVE_BUFFER_SIZE ? next.slice(next.length - LIVE_BUFFER_SIZE) : next;
    });
  }
}
