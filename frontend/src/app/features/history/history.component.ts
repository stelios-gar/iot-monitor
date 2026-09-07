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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { EnergyReading } from '../../core/models/energy-reading.model';
import { CsvTimestampFormat, downloadTextFile, readingsToCsv } from '../../core/utils/csv.util';
import { combineDateAndTime, formatFilenameStamp } from '../../core/utils/date-format.util';
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
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatMenuModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSortModule,
    MatTableModule,
    MatTimepickerModule,
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

  /**
   * Date/time filter state, split across a `mat-datepicker` (date) and a
   * `mat-timepicker` (time) per bound, since Material doesn't offer a single
   * combined date+time control. `null` means that half is unset.
   */
  protected readonly fromDate = signal<Date | null>(null);
  protected readonly fromTime = signal<Date | null>(null);
  protected readonly toDate = signal<Date | null>(null);
  protected readonly toTime = signal<Date | null>(null);

  protected readonly filteredReadings = computed<EnergyReading[]>(() => {
    const fromMs = combineDateAndTime(this.fromDate(), this.fromTime(), 'start-of-day')?.getTime() ?? null;
    const toMs = combineDateAndTime(this.toDate(), this.toTime(), 'end-of-day')?.getTime() ?? null;

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

  protected onFromDateChange(date: Date | null): void {
    this.fromDate.set(date);
  }

  protected onFromTimeChange(time: Date | null): void {
    this.fromTime.set(time);
  }

  protected onToDateChange(date: Date | null): void {
    this.toDate.set(date);
  }

  protected onToTimeChange(time: Date | null): void {
    this.toTime.set(time);
  }

  protected clearFilters(): void {
    this.fromDate.set(null);
    this.fromTime.set(null);
    this.toDate.set(null);
    this.toTime.set(null);
  }

  /**
   * Downloads the currently filtered readings as a CSV file.
   * `format` picks how the Timestamp column is written: 'iso' for
   * machine-parseable ISO 8601, 'readable' for a human-friendly
   * YYYY/MM/DD, HH:MM:SS string.
   */
  protected exportCsv(format: CsvTimestampFormat): void {
    const readings = this.filteredReadings();
    if (!readings.length) {
      return;
    }
    const stamp = formatFilenameStamp();
    const suffix = format === 'readable' ? 'readable' : 'iso';
    downloadTextFile(
      readingsToCsv(readings, format),
      `energy-readings-${suffix}-${stamp}.csv`,
      'text/csv;charset=utf-8;',
    );
  }
}
