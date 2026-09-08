import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ConnectionStatus } from '../models/energy-reading.model';
import { RealtimeService } from '../services/realtime.service';
import { ReadingsStoreService } from './readings-store.service';

/**
 * Stands in for RealtimeService so tests never open a real STOMP/SockJS
 * connection to a backend that isn't running.
 */
class FakeRealtimeService {
  readonly status = signal<ConnectionStatus>('idle');
  readonly connect = vi.fn();
  readonly disconnect = vi.fn();
}

describe('ReadingsStoreService', () => {
  let store: ReadingsStoreService;
  let fakeRealtime: FakeRealtimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: RealtimeService, useClass: FakeRealtimeService }],
    });
    store = TestBed.inject(ReadingsStoreService);
    fakeRealtime = TestBed.inject(RealtimeService) as unknown as FakeRealtimeService;
  });

  it('defaults to mock mode, reported as always connected', () => {
    expect(store.mode()).toBe('mock');
    expect(store.connectionStatus()).toBe('connected');
    expect(fakeRealtime.connect).not.toHaveBeenCalled();
  });

  it('switching to live mode connects the realtime client and mirrors its status', () => {
    store.setMode('live');
    expect(store.mode()).toBe('live');
    expect(fakeRealtime.connect).toHaveBeenCalledTimes(1);

    fakeRealtime.status.set('connected');
    expect(store.connectionStatus()).toBe('connected');

    fakeRealtime.status.set('error');
    expect(store.connectionStatus()).toBe('error');
  });

  it('is a no-op when setMode is called with the mode already active', () => {
    store.setMode('mock'); // already the default
    expect(store.mode()).toBe('mock');
    expect(fakeRealtime.connect).not.toHaveBeenCalled();
  });

  it('switching back to mock mode disconnects the realtime client', () => {
    store.setMode('live');
    const disconnectCallsSoFar = fakeRealtime.disconnect.mock.calls.length;

    store.setMode('mock');

    expect(store.mode()).toBe('mock');
    expect(store.connectionStatus()).toBe('connected');
    expect(fakeRealtime.disconnect.mock.calls.length).toBe(disconnectCallsSoFar + 1);
  });

  it('clears the live reading buffer when the mode changes', () => {
    // appendReadings() is private; reach it the same way a real batch from
    // the mock/live source would, to check the buffer-reset behavior on a
    // mode switch without waiting on a real timer tick.
    (store as any).appendReadings([
      { id: 1, timestamp: '2026-09-06T08:00:00Z', voltage: 3.9, current: 25, power: 97.5, payloadSize: 64 },
    ]);
    expect(store.liveReadings().length).toBe(1);

    store.setMode('live');

    expect(store.liveReadings().length).toBe(0);
  });
});
