from typing import Protocol

from apps.risk_alerts.domain.models import AlertaZonaRiesgo


class RiskZoneAlertRepository(Protocol):
    """The `riskZoneAlerts` collection."""

    def new_id(self) -> str: ...

    def get(self, alert_id: str) -> AlertaZonaRiesgo | None: ...

    def save(self, alert: AlertaZonaRiesgo) -> None:
        """Creates or replaces the alert."""
        ...

    def delete(self, alert_id: str) -> None: ...

    # Last: the method name shadows the builtin `list` for the annotations that follow it.
    def list(self, city_id: str | None = None) -> list[AlertaZonaRiesgo]:
        """Every alert, or those of one city or zone."""
        ...
