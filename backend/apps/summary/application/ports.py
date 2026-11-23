from collections.abc import Mapping
from typing import Protocol

from apps.risk_alerts.domain.models import AlertaZonaRiesgo
from apps.routes.domain.models import Ruta
from apps.summary.domain.metrics import LatestUser, UserRecord


class SummarySource(Protocol):
    """Bounded reads of what the summary counts. Each `limit` caps the documents read."""

    def users(self, limit: int) -> list[UserRecord]: ...

    def latest_users(self, limit: int) -> list[LatestUser]:
        """The newest accounts that have a creation date, newest first (a query, not a scan)."""
        ...

    def private_documents(self, limit: int) -> list[tuple[str, Mapping[str, object]]]:
        """`(document id, data)` of the documents under every `users/{uid}/private`."""
        ...

    def routes(self, limit: int) -> list[Ruta]: ...

    def time_slot_count(self) -> int:
        """Every time slot of every route (an aggregation query, no documents read)."""
        ...

    def risk_factor_severities(self, limit: int) -> list[str]:
        """The stored severity of every risk factor of every segment."""
        ...

    def risk_zone_alerts(self, limit: int) -> list[AlertaZonaRiesgo]: ...

    def incident_dates(self, limit: int) -> list[str]:
        """The stored `YYYY-MM-DD` date of every safety incident (nothing else is read)."""
        ...
