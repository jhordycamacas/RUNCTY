from apps.risk_alerts.domain.models import AlertaZonaRiesgo
from apps.shared.infrastructure.firebase.collections import RISK_ZONE_ALERTS
from apps.shared.infrastructure.firebase.documents import DocumentStore, FirestoreDocumentStore


class FirestoreRiskZoneAlertRepository:
    """`RiskZoneAlertRepository` adapter over `riskZoneAlerts`."""

    def __init__(self, store: DocumentStore | None = None) -> None:
        self._store = store or FirestoreDocumentStore(RISK_ZONE_ALERTS)

    def new_id(self) -> str:
        return self._store.new_id()

    def get(self, alert_id: str) -> AlertaZonaRiesgo | None:
        data = self._store.get(alert_id)
        return None if data is None else AlertaZonaRiesgo.from_document(alert_id, data)

    def save(self, alert: AlertaZonaRiesgo) -> None:
        self._store.set(alert.id, alert.to_document())

    def delete(self, alert_id: str) -> None:
        self._store.delete(alert_id)

    def list(self, city_id: str | None = None) -> list[AlertaZonaRiesgo]:
        documents = self._store.all() if city_id is None else self._store.where("cityId", city_id)
        return [AlertaZonaRiesgo.from_document(i, data) for i, data in documents]
