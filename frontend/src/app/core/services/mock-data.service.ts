import { Injectable } from '@angular/core';
import { Observable, interval, map } from 'rxjs';
import { EnergyReading } from '../models/energy-reading.model';

/**
 * Generates synthetic-but-plausible energy readings so the UI can be built,
 * demoed and screenshotted before the RP2350 firmware exists (or whenever
 * the backend / hardware is unavailable). Simulates a device that is mostly
 * idle with periodic LTE transmission bursts, which is the same shape of
 * signal the real hub is expected to produce.
 */
@Injectable({ providedIn: 'root' })
export class MockDataService {
  private static readonly IDLE_VOLTAGE = 3.9;
  private static readonly MIN_VOLTAGE = 3.55;
  private static readonly MAX_VOLTAGE = 4.15;
  private static readonly IDLE_CURRENT_MA = 25;
  private static readonly BURST_CURRENT_MA = 280;
  private static readonly BURST_PROBABILITY = 0.12;
  private static readonly IDLE_PAYLOAD_RANGE: [number, number] = [32, 120];
  private static readonly BURST_PAYLOAD_RANGE: [number, number] = [200, 1400];

  private voltage = MockDataService.IDLE_VOLTAGE;

  /** Emits one synthetic reading at a fixed cadence, like a live telemetry feed. */
  liveStream(periodMs = 1000): Observable<EnergyReading> {
    return interval(periodMs).pipe(map(() => this.generateReading()));
  }

  /**
   * Produces a batch of historical readings for the history page, spaced
   * `intervalSeconds` apart, ending at the current time.
   */
  generateHistory(hours: number, intervalSeconds: number): EnergyReading[] {
    const now = Date.now();
    const pointCount = Math.max(1, Math.floor((hours * 3600) / intervalSeconds));
    const readings: EnergyReading[] = [];

    for (let i = pointCount; i >= 0; i--) {
      const timestamp = new Date(now - i * intervalSeconds * 1000).toISOString();
      readings.push({ ...this.generateReading(timestamp), id: pointCount - i + 1 });
    }
    return readings;
  }

  private generateReading(timestamp = new Date().toISOString()): EnergyReading {
    const isBurst = Math.random() < MockDataService.BURST_PROBABILITY;

    const drift = (Math.random() - 0.5) * 0.02 - (isBurst ? 0.03 : 0);
    this.voltage = clamp(
      this.voltage + drift,
      MockDataService.MIN_VOLTAGE,
      MockDataService.MAX_VOLTAGE,
    );

    const current = isBurst
      ? MockDataService.BURST_CURRENT_MA + (Math.random() - 0.5) * 60
      : MockDataService.IDLE_CURRENT_MA + (Math.random() - 0.5) * 8;

    const payloadRange = isBurst
      ? MockDataService.BURST_PAYLOAD_RANGE
      : MockDataService.IDLE_PAYLOAD_RANGE;

    const voltage = round(this.voltage, 3);
    const currentMa = round(Math.max(current, 1), 2);

    return {
      timestamp,
      voltage,
      current: currentMa,
      power: round(voltage * currentMa, 2), // V * mA = mW
      payloadSize: Math.round(randomBetween(payloadRange[0], payloadRange[1])),
    };
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}
