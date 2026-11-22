import { RiskZoneAlert, RiskZoneAlertRepository } from '../domain/risk-zone-alert';

/** Answers what the test puts in `alerts` (an `Error` makes it fail). */
export class FakeRiskZoneAlertRepository extends RiskZoneAlertRepository {
  alerts: RiskZoneAlert[] | Error = [];

  async listActive(): Promise<RiskZoneAlert[]> {
    if (this.alerts instanceof Error) throw this.alerts;
    return this.alerts;
  }
}

export const riskZoneAlert = (overrides: Partial<RiskZoneAlert> = {}): RiskZoneAlert => ({
  id: 'a1',
  type: 'robbery',
  severity: 'alta',
  description: 'Robos reportados al anochecer',
  location: { lat: -4, lng: -79.2 },
  radiusM: 300,
  cityId: 'loja',
  validFrom: '2026-11-20',
  validTo: '2026-11-30',
  startTime: '18:00',
  endTime: '21:00',
  ...overrides,
});
