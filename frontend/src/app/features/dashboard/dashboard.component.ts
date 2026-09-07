import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { ReadingsStoreService } from '../../core/state/readings-store.service';

const CHART_POINT_LIMIT = 60;

@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonToggleModule,
    BaseChartDirective,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  protected readonly store = inject(ReadingsStoreService);

  protected readonly latest = this.store.latest;
  protected readonly mode = this.store.mode;
  protected readonly connectionStatus = this.store.connectionStatus;

  protected readonly chartData = computed(() => {
    const readings = this.store.liveReadings().slice(-CHART_POINT_LIMIT);
    return {
      labels: readings.map((r) => new Date(r.timestamp).toLocaleTimeString()),
      datasets: [
        {
          type: 'line',
          label: 'Power (mW)',
          data: readings.map((r) => r.power),
          yAxisID: 'yPower',
          borderColor: '#00838f',
          backgroundColor: 'rgba(0, 131, 143, 0.15)',
          fill: true,
          tension: 0.3,
          pointRadius: 0,
          borderWidth: 2,
          order: 1,
        },
        {
          type: 'bar',
          label: 'Payload (bytes)',
          data: readings.map((r) => r.payloadSize),
          yAxisID: 'yPayload',
          backgroundColor: 'rgba(239, 108, 0, 0.55)',
          order: 2,
        },
      ],
    };
  });

  protected readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { ticks: { maxTicksLimit: 8, autoSkip: true } },
      yPower: {
        position: 'left',
        title: { display: true, text: 'Power (mW)' },
        beginAtZero: true,
      },
      yPayload: {
        position: 'right',
        title: { display: true, text: 'Payload (bytes)' },
        beginAtZero: true,
        grid: { drawOnChartArea: false },
      },
    },
  };

  protected setMode(mode: 'live' | 'mock'): void {
    this.store.setMode(mode);
  }

  protected statusLabel(): string {
    if (this.mode() === 'mock') {
      return 'Simulated';
    }
    switch (this.connectionStatus()) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting…';
      case 'disconnected':
        return 'Disconnected';
      case 'error':
        return 'Connection error';
      default:
        return 'Idle';
    }
  }
}
