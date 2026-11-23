from collections.abc import Mapping

from google.cloud.firestore import Query

from apps.risk_alerts.domain.models import AlertaZonaRiesgo
from apps.routes.domain.models import Ruta
from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import (
    RISK_ZONE_ALERTS,
    ROUTES,
    SAFETY_INCIDENTS,
    USER_PRIVATE,
    USERS,
)
from apps.summary.domain.metrics import LatestUser, UserRecord
from apps.users.domain.models import PreferenciaUsuario

TIME_SLOTS = "timeSlots"
RISK_FACTORS = "riskFactors"


def _text(value: object) -> str:
    return value if isinstance(value, str) else ""


class FirestoreSummarySource:
    """`SummarySource` adapter. Collection-group reads without filters need no composite index."""

    def users(self, limit: int) -> list[UserRecord]:
        query = (
            firestore_client()
            .collection(USERS)
            .select(["role", "createdAt", "cityId"])
            .limit(limit)
        )
        records = []
        for snapshot in query.stream():
            data = snapshot.to_dict() or {}
            role, created, city = data.get("role"), data.get("createdAt"), data.get("cityId")
            records.append(
                UserRecord(
                    role if isinstance(role, str) and role else None,
                    created if hasattr(created, "astimezone") else None,
                    city if isinstance(city, str) and city else None,
                )
            )
        return records

    def latest_users(self, limit: int) -> list[LatestUser]:
        # One ordered query on a single field (no composite index); accounts without a
        # creation date are left out by the ordering itself.
        query = (
            firestore_client()
            .collection(USERS)
            .order_by("createdAt", direction=Query.DESCENDING)
            .select(["firstName", "lastName", "cityId", "createdAt"])
            .limit(limit)
        )
        latest = []
        for snapshot in query.stream():
            data = snapshot.to_dict() or {}
            created, city = data.get("createdAt"), data.get("cityId")
            if not hasattr(created, "astimezone"):
                continue
            latest.append(
                LatestUser(
                    uid=snapshot.id,
                    first_name=_text(data.get("firstName")),
                    last_name=_text(data.get("lastName")),
                    city_id=city if isinstance(city, str) and city else None,
                    created_at=created,
                )
            )
        return latest

    def private_documents(self, limit: int) -> list[tuple[str, Mapping[str, object]]]:
        # Only the preference fields and the sport level are read: the photo document (up to
        # ~700 KB of base64) would otherwise travel with every scan. The other documents are
        # counted by id.
        fields = [*PreferenciaUsuario().to_document(), "level"]
        query = firestore_client().collection_group(USER_PRIVATE).select(fields).limit(limit)
        return [(snapshot.id, snapshot.to_dict() or {}) for snapshot in query.stream()]

    def routes(self, limit: int) -> list[Ruta]:
        query = firestore_client().collection(ROUTES).limit(limit)
        return [Ruta.from_document(s.id, s.to_dict() or {}) for s in query.stream()]

    def time_slot_count(self) -> int:
        result = firestore_client().collection_group(TIME_SLOTS).count().get()
        return int(result[0][0].value)

    def risk_factor_severities(self, limit: int) -> list[str]:
        query = firestore_client().collection_group(RISK_FACTORS).select(["severity"]).limit(limit)
        return [str((s.to_dict() or {}).get("severity", "")) for s in query.stream()]

    def risk_zone_alerts(self, limit: int) -> list[AlertaZonaRiesgo]:
        query = firestore_client().collection(RISK_ZONE_ALERTS).limit(limit)
        return [AlertaZonaRiesgo.from_document(s.id, s.to_dict() or {}) for s in query.stream()]

    def incident_dates(self, limit: int) -> list[str]:
        query = firestore_client().collection(SAFETY_INCIDENTS).select(["date"]).limit(limit)
        return [str((s.to_dict() or {}).get("date", "")) for s in query.stream()]
