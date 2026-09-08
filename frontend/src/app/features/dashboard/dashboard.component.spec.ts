import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { vi } from 'vitest';
import { ConnectionStatus } from '../../core/models/energy-reading.model';
import { RealtimeService } from '../../core/services/realtime.service';
import { ReadingsStoreService } from '../../core/state/readings-store.service';
import { DashboardComponent } from './dashboard.component';

/** Stands in for RealtimeService so no real STOMP/SockJS connection is opened. */
class FakeRealtimeService {
  readonly status = signal<ConnectionStatus>('idle');
  connect(): void {}
  disconnect(): void {}
}

describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideNoopAnimations(),
        provideCharts(withDefaultRegisterables()),
        { provide: RealtimeService, useClass: FakeRealtimeService },
      ],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('delegates mode changes to the readings store', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance as any;
    const store = TestBed.inject(ReadingsStoreService);
    const setModeSpy = vi.spyOn(store, 'setMode');

    component.setMode('live');

    expect(setModeSpy).toHaveBeenCalledWith('live');
    expect(component.mode()).toBe('live');
  });

  it('shows a "Simulated" status label in mock mode, regardless of the realtime connection', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance as any;

    expect(component.mode()).toBe('mock');
    expect(component.statusLabel()).toBe('Simulated');
  });

  it('reflects the realtime connection status once switched to live mode', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance as any;
    const fakeRealtime = TestBed.inject(RealtimeService) as unknown as FakeRealtimeService;

    component.setMode('live');
    fakeRealtime.status.set('connecting');
    expect(component.statusLabel()).toBe('Connecting…');

    fakeRealtime.status.set('error');
    expect(component.statusLabel()).toBe('Connection error');
  });
});
