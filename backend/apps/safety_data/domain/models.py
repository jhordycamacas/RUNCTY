"""EP-08: information sources (`informationSources/{id}`) and safety incidents
(`safetyIncidents/{id}`), and how the incidents feed the safety index (RF-07-11).

`parse` validates client input and raises an `invalid-argument` domain error whose `reason`
the clients translate. `from_document` reads what is stored and never raises.
"""

from collections.abc import Iterable, Mapping
from dataclasses import dataclass
from datetime import date, datetime, timedelta

from apps.routes.domain.models import (
    as_mapping,
    optional_text,
    parse_doc_id,
    required_text,
    stored_optional_text,
    stored_text,
)
from apps.routes.domain.safety import ExtraPenalty
from apps.routes.domain.time import DAY_MINUTES, is_iso_date, parse_time
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.domain.text import sort_key

INCIDENT_TYPES = ("robbery", "assault", "harassment", "traffic_accident", "other")
# Severity of the index penalty of each incident type (design decisions of EP-08).
_INCIDENT_SEVERITY = {
    "robbery": "high",
    "assault": "high",
    "harassment": "medium",
    "traffic_accident": "low",
    "other": "low",
}
INCIDENT_PENALTY_SOURCE = "incident"
# An incident penalizes the time slots that cover its hour, plus or minus this margin.
_PENALTY_MARGIN_MINUTES = 60
# Only the incidents of the last 12 months count in the index.
_COUNTED_DAYS = 365

_MAX_ENTITY = 80
_MAX_DATA_TYPE = 80
_MAX_DATA = 5000


def _invalid(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.INVALID_ARGUMENT, reason, message)


def _hh_mm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


@dataclass(frozen=True, slots=True)
class FuenteInformacion:
    """An information source: who provides safety data (entity) and of which kind."""

    id: str
    entity: str
    data_type: str
    # Day the data was last loaded or changed (YYYY-MM-DD), set by the server.
    loaded_at: str
    data: str | None = None

    @classmethod
    def parse(cls, raw: object, source_id: str, loaded_at: date) -> "FuenteInformacion":
        source_id = parse_doc_id(source_id, "invalid-source-id")
        values = as_mapping(raw)
        entity = required_text(
            values.get("entity"),
            _MAX_ENTITY,
            "invalid-source-entity",
            f"Entity is required (max {_MAX_ENTITY} chars).",
        )
        data_type = required_text(
            values.get("dataType"),
            _MAX_DATA_TYPE,
            "invalid-source-data-type",
            f"Data type is required (max {_MAX_DATA_TYPE} chars).",
        )
        data = optional_text(
            values.get("data"),
            _MAX_DATA,
            "invalid-source-data",
            f"Loaded data must be text (max {_MAX_DATA} chars).",
        )
        return cls(source_id, entity, data_type, loaded_at.isoformat(), data or None)

    @classmethod
    def from_document(cls, source_id: str, data: Mapping[str, object]) -> "FuenteInformacion":
        return cls(
            id=source_id,
            entity=stored_text(data.get("entity"), source_id),
            data_type=stored_text(data.get("dataType")),
            loaded_at=stored_text(data.get("loadedAt")),
            data=stored_optional_text(data.get("data")),
        )

    def to_document(self) -> dict[str, object]:
        return {
            "entity": self.entity,
            "dataType": self.data_type,
            "loadedAt": self.loaded_at,
            "data": self.data,
        }

    def same_origin(self, other: "FuenteInformacion") -> bool:
        """Same entity with the same data type, ignoring case and accents."""
        return (sort_key(self.entity), sort_key(self.data_type)) == (
            sort_key(other.entity),
            sort_key(other.data_type),
        )


@dataclass(frozen=True, slots=True)
class IncidenteSeguridad:
    """A safety incident on a route, or on one of its segments, backed by a source."""

    id: str
    route_id: str
    segment_id: str | None
    type: str
    date: str
    time: str
    source_id: str
    # The source was deleted: the record stays for the history but no longer counts.
    source_deleted: bool = False

    @classmethod
    def parse(cls, raw: object, incident_id: str, now: datetime) -> "IncidenteSeguridad":
        """`now` is the local wall clock: an incident cannot be after it."""
        incident_id = parse_doc_id(incident_id, "invalid-incident-id")
        data = as_mapping(raw)
        route_id = parse_doc_id(data.get("routeId"), "invalid-route-id")
        segment = data.get("segmentId")
        segment_id = None if segment is None else parse_doc_id(segment, "invalid-segment-id")
        incident_type = data.get("type")
        if not isinstance(incident_type, str) or incident_type not in INCIDENT_TYPES:
            raise _invalid("invalid-incident-type", "Unknown incident type.")
        day, time = data.get("date"), data.get("time")
        if not is_iso_date(day):
            raise _invalid("invalid-incident-date", "Date must be YYYY-MM-DD.")
        minutes = parse_time(time)
        if minutes is None or minutes >= DAY_MINUTES:
            raise _invalid("invalid-incident-time", "Time must be HH:MM (00:00-23:59).")
        if datetime.fromisoformat(f"{day}T{time}") > now.replace(tzinfo=None):
            raise _invalid("incident-in-future", "The incident cannot be after the current date.")
        source_id = parse_doc_id(data.get("sourceId"), "invalid-source-id")
        return cls(incident_id, route_id, segment_id, incident_type, day, time, source_id)

    @classmethod
    def from_document(
        cls, incident_id: str, data: Mapping[str, object]
    ) -> "IncidenteSeguridad | None":
        """None for a malformed document, so it never breaks the index."""
        incident_type, day, time = data.get("type"), data.get("date"), data.get("time")
        minutes = parse_time(time)
        if (
            incident_type not in INCIDENT_TYPES
            or not is_iso_date(day)
            or minutes is None
            or minutes >= DAY_MINUTES
        ):
            return None
        return cls(
            id=incident_id,
            route_id=stored_text(data.get("routeId")),
            segment_id=stored_optional_text(data.get("segmentId")),
            type=incident_type,
            date=day,
            time=time,
            source_id=stored_text(data.get("sourceId")),
            source_deleted=data.get("sourceDeleted") is True,
        )

    def to_document(self) -> dict[str, object]:
        return {
            "routeId": self.route_id,
            "segmentId": self.segment_id,
            "type": self.type,
            "date": self.date,
            "time": self.time,
            "sourceId": self.source_id,
            "sourceDeleted": self.source_deleted,
        }

    def counts_on(self, today: date) -> bool:
        """It counts in the index: its source exists and it is from the last 12 months."""
        happened = date.fromisoformat(self.date)
        return not self.source_deleted and today - timedelta(days=_COUNTED_DAYS) <= happened

    def penalty(self) -> ExtraPenalty:
        """The index penalty: by type, in the window of its hour plus or minus one hour."""
        minutes = parse_time(self.time) or 0
        start = max(0, minutes - _PENALTY_MARGIN_MINUTES)
        end = min(DAY_MINUTES, minutes + _PENALTY_MARGIN_MINUTES)
        return ExtraPenalty(
            source=INCIDENT_PENALTY_SOURCE,
            type=self.type,
            severity=_INCIDENT_SEVERITY[self.type],
            description=f"Incidente registrado el {self.date} a las {self.time}.",
            start_time=_hh_mm(start),
            end_time=_hh_mm(end),
        )


def incident_penalties(
    incidents: Iterable[IncidenteSeguridad], segment_id: str, today: date
) -> list[ExtraPenalty]:
    """The penalties of a segment: its incidents and those registered on the whole route."""
    return [
        incident.penalty()
        for incident in incidents
        if incident.segment_id in (None, segment_id) and incident.counts_on(today)
    ]
