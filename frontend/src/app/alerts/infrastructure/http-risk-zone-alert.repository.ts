import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiClient } from '../../core/api/api-client';
import { ApiError } from '../../core/errors/api-error';
import { toRiskZoneAlert } from '../domain/mappers';
import { RiskZoneAlert, RiskZoneAlertRepository } from '../domain/risk-zone-alert';

/**
 * `GET /risk-zone-alerts?cityId=&active=true`. Until the endpoint is deployed (Sprint 3) the API
 * answers 404, which means "no alerts" for the runner, not a failure.
 */
@Injectable()
export class HttpRiskZoneAlertRepository extends RiskZoneAlertRepository {
  private readonly api = inject(ApiClient);

  async listActive(cityId: string): Promise<RiskZoneAlert[]> {
    try {
      const { alerts } = await firstValueFrom(
        this.api.get<{ alerts: unknown[] }>('/risk-zone-alerts', { cityId, active: true }),
      );
      return Array.isArray(alerts) ? alerts.map(toRiskZoneAlert) : [];
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) return [];
      throw error;
    }
  }
}
