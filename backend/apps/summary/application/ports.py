from collections.abc import Mapping
from typing import Protocol

from apps.routes.domain.models import Ruta
from apps.summary.domain.metrics import UserRecord


class SummarySource(Protocol):
    """Bounded reads of what the summary counts. Each `limit` caps the documents read."""

    def users(self, limit: int) -> list[UserRecord]: ...

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
