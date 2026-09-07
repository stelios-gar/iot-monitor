// sockjs-client (used by RealtimeService for the STOMP/WebSocket connection to the
// backend) is a CommonJS package written for Node.js — it expects the `global` and
// `process` objects to exist. Older Angular (webpack) auto-polyfilled these; the
// current esbuild/rolldown-based build does not, so without this shim the app
// throws `ReferenceError: global is not defined` as soon as anything that imports
// RealtimeService (the dashboard/history routes) is loaded. Must run before any
// other import.
(globalThis as any).global ??= globalThis;
(globalThis as any).process ??= { env: {} };

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
