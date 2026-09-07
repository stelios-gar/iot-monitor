import { DatePipe, DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ViewChild,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { EnergyReading } from '../../core/models/energy-reading.model';
import { ApiService } from '../../core/services/api.service';
import { MockDataService } from '../../core/services/mock-data.service';
import { ReadingsStoreService } from '../../core/state/readings-store.service';

/** Synthetic-history window used when the app is in simulated-data mode. */
const MOCK_HISTORY_HOURS = 6;
const MOCK_HISTORY_INTERVAL_SECONDS = 30;
const CHART_POINT_LIMIT = 300;

@Component({
  selector: 'app-history',
  imports: [
    DatePipe,
    DecimalPipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    BaseChartDirective,
  ],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent implements AfterViewInit {
  private readonly api = inject(ApiService);
  private readonly mock = inject(MockDataService);
  protected readonly store = inject(ReadingsStoreService);

  @ViewChild(MatSort) private sort!: MatSort;
  @ViewChild(MatPaginator) private paginator!: MatPaginator;

  protected readonly displayedColumns = ['timestamp', 'voltage', 'current', 'power', 'payloadSize'];
  protected readonly dataSource = new MatTableDataSource<EnergyReading>([]);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly allReadings = signal<EnergyReading[]>([]);

  /** `datetime-local` input values (empty string = unset). */
  protected readonly fromFilter = signal('');
  protected readonly toFilter = signal('');

  protected readonly filteredReadings = computed<EnergyReading[]>(() => {
    const fromMs = this.fromFilter() ? new Date(this.fromFilter()).getTime() : null;
    const toMs = this.toFilter() ? new Date(this.toFilter()).getTime() : null;

    return this.allReadings().filter((reading) => {
      const t = new Date(reading.timestamp).getTime();
      if (fromMs !== null && t < fromMs) return false;
      if (toMs !== null && t > toMs) return false;
      return true;
    });
  });

  protected readonly chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const readings = this.filteredReadings().slice(-CHART_POINT_LIMIT);
    return {
      labels: readings.map((r) => new Date(r.timestamp).toLocaleString()),
      datasets: [
        {
          label: 'Power (mW)',
          data: readings.map((r) => r.power),
          borderColor: '#00838f',
          backgroundColor: 'rgba(0, 131, 143, 0.15)',
          fill: true,
          tension: 0.25,
          pointRadius: 0,
          borderWidth: 2,
        },
      ],
    };
  });

  protected readonly chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      x: { ticks: { maxTicksLimit: 6, autoSkip: true } },
      y: { title: { display: true, text: 'Power (mW)' }, beginAtZero: true },
    },
  };

  constructor() {
    // Keep the Material table in sync with the (mode-aware, date-filtered) reading set.
    effect(() => {
      this.dataSource.data = this.filteredReadings();
    });

    this.load();
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
  }

  /** Reloads history from the backend, or regenerates it from MockDataService in simulated mode. */
  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    if (this.store.mode() === 'mock') {
      this.allReadings.set(this.mock.generateHistory(MOCK_HISTORY_HOURS, MOCK_HISTORY_INTERVAL_SECONDS));
      this.loading.set(false);
      return;
    }

    this.api.getHistory().subscribe({
      next: (readings) => {
        this.allReadings.set(readings);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not reach the backend at /api/data/history — is it running?');
        this.loading.set(false);
      },
    });
  }

  protected onFromChange(value: string): void {
    this.fromFilter.set(value);
  }

  protected onToChange(value: string): void {
    this.toFilter.set(value);
  }

  protected clearFilters(): void {
    this.fromFilter.set('');
    this.toFilter.set('');
  }
}
