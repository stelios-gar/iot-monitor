import { Injectable, signal } from '@angular/core';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { ConnectionStatus, EnergyReading } from '../models/energy-reading.model';

/**
 * Live data source: connects to the backend's STOMP-over-SockJS endpoint
 * and receives the same batches the backend flushes to the database.
 * See backend/src/main/java/com/iot/backend/websocket/WebSocketConfig.java
 * and service/WebSocketService.java (topic: /topic/readings).
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private client: Client | null = null;

  readonly status = signal<ConnectionStatus>('idle');

  /** Opens the STOMP connection and invokes `onBatch` for every message received. */
  connect(onBatch: (readings: EnergyReading[]) => void): void {
    if (this.client?.active) {
      return;
    }

    this.status.set('connecting');

    this.client = new Client({
      webSocketFactory: () => new SockJS(`${environment.apiBaseUrl}/ws`),
      reconnectDelay: 4000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        this.status.set('connected');
        this.client?.subscribe('/topic/readings', (message: IMessage) => {
          try {
            const batch = JSON.parse(message.body) as EnergyReading[];
            onBatch(batch);
          } catch {
            // Malformed frame — ignore rather than crash the live view.
          }
        });
      },
      onWebSocketClose: () => this.status.set('disconnected'),
      onStompError: () => this.status.set('error'),
      onWebSocketError: () => this.status.set('error'),
    });

    this.client.activate();
  }

  disconnect(): void {
    this.client?.deactivate();
    this.client = null;
    this.status.set('idle');
  }
}
