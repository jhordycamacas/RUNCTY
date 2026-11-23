"""RF-07-12 to RF-07-15: risk zone alerts (`riskZoneAlerts/{id}`).

An alert is a circular zone with a validity period and an optional daily window. In Sprint 3
alerts are only shown to the runner; they do not change the safety index.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime

from apps.cities.domain.models import parse_city_id
from apps.routes.domain.geo import LatLng
from apps.routes.domain.models import (
    as_mapping,
    is_number,
    parse_doc_id,
    parse_lat_lng,
    parse_window,
    required_text,
    stored_number,
    stored_optional_text,
    stored_text,
)
from apps.routes.domain.time import is_iso_date, minutes_of_day, to_window
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.system_settings.domain.models import SystemSettings

ALERT_SEVERITIES = ("alta", "media", "baja")

_MAX_TYPE = 40
_MAX_DESCRIPTION = 200


def _invalid(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.INVALID_ARGUMENT, reason, message)


@dataclass(frozen=True, slots=True)
class AlertaZonaRiesgo:
    id: str
    type: str
    severity: str
    description: str
    location: LatLng
    radius_m: float
    city_id: str
    valid_from: str
    valid_to: str
    route_id: str | None = None
    start_time: str | None = None
    end_time: str | None = None

    @classmethod
    def parse(cls, raw: object, alert_id: str, settings: SystemSettings) -> "AlertaZonaRiesgo":
        alert_id = parse_doc_id(alert_id, "invalid-alert-id")
        data = as_mapping(raw)
        alert_type = required_text(
            data.get("type"),
            _MAX_TYPE,
            "invalid-alert-type",
            f"Type is required (max {_MAX_TYPE} chars).",
        )
        severity = data.get("severity")
        if not isinstance(severity, str) or severity not in ALERT_SEVERITIES:
            raise _invalid("invalid-alert-severity", "Severity must be alta, media or baja.")
        description = required_text(
            data.get("description"),
            _MAX_DESCRIPTION,
            "invalid-alert-description",
            f"Description is required (max {_MAX_DESCRIPTION} chars).",
        )
        location = parse_lat_lng(data.get("location"))
        if location is None:
            raise _invalid(
                "invalid-location", "Location needs a lat in -90..90 and lng in -180..180."
            )
        radius = data.get("radiusM")
        max_radius = settings.max_alert_radius_m
        if not is_number(radius) or not 0 < radius <= max_radius:
            raise _invalid(
                "invalid-alert-radius",
                f"radiusM must be greater than 0 and at most {max_radius} m.",
            )
        city_id = parse_city_id(data.get("cityId"))
        route = data.get("routeId")
        route_id = None if route is None else parse_doc_id(route, "invalid-route-id")
        valid_from, valid_to = data.get("validFrom"), data.get("validTo")
        if not is_iso_date(valid_from):
            raise _invalid("invalid-valid-from", "validFrom must be YYYY-MM-DD.")
        if not is_iso_date(valid_to):
            raise _invalid("invalid-valid-to", "validTo must be YYYY-MM-DD.")
        if valid_from > valid_to:
            raise _invalid("invalid-date-range", "validFrom must not be after validTo.")
        # A null bound is an absent one, so a client can send back what it read.
        window = {key: data[key] for key in ("startTime", "endTime") if data.get(key) is not None}
        start_time, end_time = parse_window(window, required=False)
        return cls(
            id=alert_id,
            type=alert_type,
            severity=severity,
            description=description,
            location=location,
            radius_m=radius,
            city_id=city_id,
            valid_from=valid_from,
            valid_to=valid_to,
            route_id=route_id,
            start_time=start_time,
            end_time=end_time,
        )

    @classmethod
    def from_document(cls, alert_id: str, data: Mapping[str, object]) -> "AlertaZonaRiesgo":
        severity, location = data.get("severity"), as_mapping(data.get("location"))
        return cls(
            id=alert_id,
            type=stored_text(data.get("type")),
            severity=severity if severity in ALERT_SEVERITIES else "alta",
            description=stored_text(data.get("description")),
            location=LatLng(stored_number(location.get("lat")), stored_number(location.get("lng"))),
            radius_m=stored_number(data.get("radiusM")),
            city_id=stored_text(data.get("cityId")),
            valid_from=stored_text(data.get("validFrom")),
            valid_to=stored_text(data.get("validTo")),
            route_id=stored_optional_text(data.get("routeId")),
            start_time=stored_optional_text(data.get("startTime")),
            end_time=stored_optional_text(data.get("endTime")),
        )

    def to_document(self) -> dict[str, object]:
        return {
            "type": self.type,
            "severity": self.severity,
            "description": self.description,
            "location": self.location.to_document(),
            "radiusM": self.radius_m,
            "cityId": self.city_id,
            "routeId": self.route_id,
            "validFrom": self.valid_from,
            "validTo": self.valid_to,
            "startTime": self.start_time,
            "endTime": self.end_time,
        }

    def is_active(self, now: datetime) -> bool:
        """In force at `now` (local wall clock): within its dates and, if any, its window."""
        if not self.valid_from <= now.date().isoformat() <= self.valid_to:
            return False
        window = to_window(self.start_time, self.end_time)
        return window.start <= minutes_of_day(now) < window.end
