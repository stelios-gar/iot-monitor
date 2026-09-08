import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take, toArray } from 'rxjs/operators';
import { MockDataService } from './mock-data.service';

// Mirrors the private IDLE/MIN/MAX_VOLTAGE constants in MockDataService.
const IDLE_VOLTAGE = 3.9;
const MIN_VOLTAGE = 3.55;
const MAX_VOLTAGE = 4.15;

describe('MockDataService', () => {
  let service: MockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockDataService);
  });

  describe('generateHistory', () => {
    it('produces one reading per interval across the requested window, oldest first', () => {
      const readings = service.generateHistory(1, 60); // 1 hour, one point every 60s
      expect(readings.length).toBe(61); // 3600/60 = 60 steps + the starting point

      for (let i = 1; i < readings.length; i++) {
        const prev = new Date(readings[i - 1].timestamp).getTime();
        const curr = new Date(readings[i].timestamp).getTime();
        expect(curr).toBeGreaterThan(prev);
      }

      expect(readings.map((r) => r.id)).toEqual(readings.map((_, i) => i + 1));
    });

    it('keeps every reading within the simulated voltage/current bounds', () => {
      const readings = service.generateHistory(2, 30);

      for (const reading of readings) {
        expect(reading.voltage).toBeGreaterThanOrEqual(MIN_VOLTAGE);
        expect(reading.voltage).toBeLessThanOrEqual(MAX_VOLTAGE);
        expect(reading.current).toBeGreaterThan(0);
        expect(reading.payloadSize).toBeGreaterThan(0);
        expect(reading.power).toBeCloseTo(reading.voltage * reading.current, 1);
      }
    });

    it("does not leak voltage state between calls (regression: History page shouldn't perturb later loads)", () => {
      // Each call's random walk starts fresh from IDLE_VOLTAGE, so the very
      // first reading of any call should stay close to it. Before this was
      // fixed, generateHistory() mutated a field shared with the live
      // stream, so repeated calls drifted further from IDLE_VOLTAGE each time.
      for (let i = 0; i < 5; i++) {
        service.generateHistory(1, 60);
      }

      const readings = service.generateHistory(1, 60);
      expect(readings[0].voltage).toBeGreaterThanOrEqual(IDLE_VOLTAGE - 0.05);
      expect(readings[0].voltage).toBeLessThanOrEqual(IDLE_VOLTAGE + 0.05);
    });
  });

  describe('liveStream', () => {
    it('emits a synthetic reading on the given cadence', async () => {
      const reading = await firstValueFrom(service.liveStream(5).pipe(take(1)));

      expect(reading.timestamp).toBeTruthy();
      expect(reading.voltage).toBeGreaterThanOrEqual(MIN_VOLTAGE);
      expect(reading.voltage).toBeLessThanOrEqual(MAX_VOLTAGE);
    });

    it('walks the voltage forward instead of resetting it every tick', async () => {
      const readings = await firstValueFrom(service.liveStream(5).pipe(take(3), toArray()));

      expect(readings).toHaveLength(3);
      // The very first tick should still be near IDLE_VOLTAGE, same as the
      // first point of a fresh generateHistory() call.
      expect(readings[0].voltage).toBeGreaterThanOrEqual(IDLE_VOLTAGE - 0.05);
      expect(readings[0].voltage).toBeLessThanOrEqual(IDLE_VOLTAGE + 0.05);
    });
  });
});
