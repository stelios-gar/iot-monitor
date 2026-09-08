# IoT Monitor — Frontend

Angular app for the IoT Energy Monitor thesis project. It connects to the
Spring Boot backend (see `../backend/README.md`) over REST for historical
data and over WebSocket/STOMP for live readings, and can also run entirely
on its own against synthetic mock data with no backend running at all.

## Stack

- Angular 22 — standalone components, Signals, zoneless change detection (no zone.js)
- Angular Material 3 — theming, table, chart card layout, sidenav app shell
- Angular CDK — responsive layout via `BreakpointObserver`
- `@stomp/stompjs` + `sockjs-client` — STOMP-over-SockJS live data feed
- `ng2-charts` / Chart.js — dashboard and history charts
- Vitest — unit tests (via the Angular CLI's `ng test`)

## Project Structure

```
src/app/
├── core/
│   ├── models/               # EnergyReading, ConnectionStatus, DataMode
│   ├── services/
│   │   ├── api.service.ts        # REST: GET /api/data/history
│   │   ├── realtime.service.ts   # STOMP/SockJS: subscribes to /topic/readings
│   │   └── mock-data.service.ts  # Synthetic reading generator (mock mode)
│   ├── state/
│   │   └── readings-store.service.ts  # Signal store; switches mock/live source
│   └── utils/
│       ├── csv.util.ts            # CSV formatting + browser download
│       └── date-format.util.ts    # Human-readable date/time formatting
├── features/
│   ├── dashboard/    # Live KPI cards + power chart, mock/live toggle
│   └── history/      # Stored-reading table + chart, date/time filters, CSV export
├── app.ts            # Root shell: toolbar + responsive sidenav
├── app.routes.ts      # /dashboard (default), /history
└── app.config.ts      # Providers: router, HttpClient, animations, charts, date adapter
```

## Prerequisites

- Node.js `^22.22.3 || ^24.15.0 || >=26.0.0` (Angular 22's supported range). This
  project is developed against **Node 24** via `nvm`:
  ```bash
  nvm install 24
  nvm use 24
  ```
- The backend running at `http://localhost:8080` — only needed for **Live** mode.
  **Mock** mode (the default on first load) needs nothing but this app.

## Setup

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is needed because a few dependencies' peer
ranges haven't been updated for Angular 22 yet; without it `npm install`
fails with a peer-dependency conflict.

## Running the App

```bash
npm start
```

Opens the dev server at `http://localhost:4200/` and reloads automatically
on source changes.

## Mock vs. Live Data

The Dashboard page has a Mock/Live toggle (`ReadingsStoreService.setMode()`):

- **Mock** — a synthetic random-walk generator (`MockDataService`) produces a
  new reading every second, so the UI is fully usable without the backend,
  the database, or an RP2350 board connected.
- **Live** — connects over STOMP/SockJS to the backend's `/ws` endpoint and
  renders whatever the backend broadcasts on `/topic/readings`.

The History page always shows data via `ApiService.getHistory()` in Live
mode, or `MockDataService.generateHistory()` in Mock mode.

## Configuration

`src/environments/environment.ts` holds the only runtime config, `apiBaseUrl`
(`http://localhost:8080` by default). Point it at a different host/port if
the backend isn't running locally.

## Features

- **Dashboard** — live KPI cards (voltage, current, power, payload size) and
  a combined line/bar chart of the most recent readings.
- **History** — a sortable, paginated table and chart of every stored
  reading, with:
  - From/To range filters using a calendar date picker (`mat-datepicker`)
    paired with a time picker (`mat-timepicker`); picking only a date
    includes that whole day.
  - CSV export, offered in either ISO 8601 or a human-readable
    `YYYY/MM/DD, HH:MM:SS` timestamp format.
- Responsive app shell — a permanent sidenav on desktop, an overlay drawer
  with a hamburger toggle on mobile (`BreakpointObserver` on `Breakpoints.Handset`).

## Running Unit Tests

```bash
npm test
```

Runs the Vitest-based test suite via `ng test`.

## Building

```bash
npm run build
```

Compiles to `dist/`. A few non-default `angular.json` settings worth
knowing about if you touch the build config:

- `allowedCommonJsDependencies` lists `@stomp/stompjs` and `sockjs-client` to
  silence CommonJS-import warnings from those packages.
- The production build has `optimization.fonts` disabled — otherwise the
  build tries to fetch Google Fonts at build time, which fails in a
  network-restricted environment.
- Bundle budgets are raised to 1.5 MB / 2.5 MB (warning/error) from the CLI
  defaults, since Material + Chart.js + STOMP push past the 500 kB/1 MB
  default budget.

## Notes for Contributors

- This project uses Angular's zoneless change detection — there's no
  `zone.js` dependency, so views update purely from Signal reads, not from
  patched async APIs. Keep new state as `signal()`/`computed()`, not plain
  fields.
- `main.ts` polyfills `global`/`process` at the very top, before any other
  import — `sockjs-client` expects these Node globals and the Angular
  esbuild-based builder doesn't provide them automatically.
