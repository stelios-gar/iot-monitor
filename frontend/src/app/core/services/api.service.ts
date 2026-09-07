import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EnergyReading } from '../models/energy-reading.model';

/**
 * Talks to the Spring Boot REST API.
 * See backend/src/main/java/com/iot/backend/controller/HistoryController.java.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/data`;

  /** GET /api/data/history — every reading stored so far. */
  getHistory(): Observable<EnergyReading[]> {
    return this.http.get<EnergyReading[]>(`${this.baseUrl}/history`);
  }
}
