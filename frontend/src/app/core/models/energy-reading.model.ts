/**
 * A single energy measurement reported by the RP2350 IoT hub.
 *
 * Units follow the backend's `EnergyReading` JPA entity
 * (see backend/src/main/java/com/iot/backend/domain/EnergyReading.java):
 *  - voltage:     volts (V)
 *  - current:     milliamps (mA)
 *  - power:       milliwatts (mW) — voltage * current
 *  - payloadSize: bytes of the LTE transmission this reading was measured against
 */
export interface EnergyReading {
  id?: number;
  timestamp: string; // ISO-8601, e.g. 2026-09-07T10:00:00Z
  voltage: number;
  current: number;
  power: number;
  payloadSize: number;
}

/** Status of the live WebSocket connection to the backend. */
export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

/** Where the app's readings are currently coming from. */
export type DataMode = 'live' | 'mock';
