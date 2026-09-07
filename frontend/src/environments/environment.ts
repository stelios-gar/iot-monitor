/**
 * Runtime configuration for the IoT Energy Monitor frontend.
 * The backend (Spring Boot) is expected to run on http://localhost:8080
 * during development, per iot-monitor/backend/README.md.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080',
};
