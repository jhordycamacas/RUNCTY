"""System parameters (`systemSettings/global`): the numbers and rules that drive the safety index,
the searches, the limits of a route, the sport profile ranges and the profile photo size. An admin
edits them (RF-02, `settings.manage`); every use case receives the current `SystemSettings` as a
parameter.

`parse` validates client input and raises an `invalid-argument` domain error naming every
rejected field. `from_document` reads what is stored and never raises: a missing or invalid
value falls back to its default. The field defaults below are the code fallback and the seed.
"""

import math
import re
from collections.abc import Mapping
from dataclasses import dataclass, fields
from zoneinfo import ZoneInfo

from apps.shared.domain.errors import invalid_fields

_COUNTRY_CODE = re.compile(r"[A-Z]{2}")


@dataclass(frozen=True, slots=True)
class _Limit:
    """A numeric parameter: its attribute, its document key and its inclusive bounds."""

    attr: str
    key: str
    low: float
    high: float
    whole: bool = True


_LIMITS = (
    _Limit("penalty_low", "penaltyLow", 0, 100),
    _Limit("penalty_medium", "penaltyMedium", 0, 100),
    _Limit("penalty_high", "penaltyHigh", 0, 100),
    _Limit("threshold_high", "thresholdHigh", 1, 100),
    _Limit("threshold_medium", "thresholdMedium", 1, 100),
    _Limit("incident_window_days", "incidentWindowDays", 1, 3650),
    _Limit("incident_margin_minutes", "incidentMarginMinutes", 0, 720),
    _Limit("nearby_radius_m", "nearbyRadiusM", 1, 10_000),
    _Limit("max_search_radius_m", "maxSearchRadiusM", 1, 200_000),
    _Limit("max_alert_radius_m", "maxAlertRadiusM", 1, 50_000),
    _Limit("max_time_slots_per_route", "maxTimeSlotsPerRoute", 1, 48),
    _Limit("max_segments_per_route", "maxSegmentsPerRoute", 1, 100),
    _Limit("max_risk_factors_per_segment", "maxRiskFactorsPerSegment", 1, 100),
    _Limit("route_name_max_length", "routeNameMaxLength", 10, 200),
    _Limit("route_description_max_length", "routeDescriptionMaxLength", 50, 2000),
    _Limit("route_max_distance_km", "routeMaxDistanceKm", 1, 1000),
    _Limit("route_max_elevation_m", "routeMaxElevationM", 1, 20_000),
    _Limit("segment_max_points", "segmentMaxPoints", 2, 2000),
    _Limit("pace_min_sec_per_km", "paceMinSecPerKm", 30, 3600),
    _Limit("pace_max_sec_per_km", "paceMaxSecPerKm", 30, 7200),
    _Limit("distance_min_km", "distanceMinKm", 0.1, 500, whole=False),
    _Limit("distance_max_km", "distanceMaxKm", 0.1, 1000, whole=False),
    _Limit("safe_route_distance_tolerance", "safeRouteDistanceTolerance", 0.01, 1, whole=False),
    _Limit("safe_route_max_distance_km", "safeRouteMaxDistanceKm", 1, 1000),
    _Limit("profile_photo_max_kb", "profilePhotoMaxKb", 20, 500),
    _Limit("profile_photo_max_px", "profilePhotoMaxPx", 64, 1024),
)
_TEXT_KEYS = {"time_zone": "timeZone", "country_code": "countryCode"}
_KEYS = {**{limit.attr: limit.key for limit in _LIMITS}, **_TEXT_KEYS}

# Parameters that, once changed, make the stored safety of every route stale.
_SAFETY_ATTRS = (
    "penalty_low",
    "penalty_medium",
    "penalty_high",
    "threshold_high",
    "threshold_medium",
    "incident_window_days",
    "incident_margin_minutes",
    "time_zone",
)
# Fields that only make sense together: an inconsistent group falls back to its defaults.
_GROUPS = (
    ("penalty_low", "penalty_medium", "penalty_high"),
    ("threshold_high", "threshold_medium"),
    ("pace_min_sec_per_km", "pace_max_sec_per_km"),
    ("distance_min_km", "distance_max_km"),
)


def _is_number(value: object) -> bool:
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def _limit_reason(value: object, limit: _Limit) -> str | None:
    if value is None:
        return "required"
    if not _is_number(value) or (limit.whole and not float(value).is_integer()):
        return "invalid"
    return None if limit.low <= value <= limit.high else "out-of-range"


def _time_zone_reason(value: object) -> str | None:
    if value is None:
        return "required"
    if not isinstance(value, str):
        return "invalid"
    try:
        ZoneInfo(value)
    except (KeyError, ValueError, OSError):
        return "invalid-time-zone"
    return None


def _country_reason(value: object) -> str | None:
    if value is None:
        return "required"
    if not isinstance(value, str):
        return "invalid"
    return None if _COUNTRY_CODE.fullmatch(value) else "invalid-country-code"


@dataclass(frozen=True, slots=True)
class SystemSettings:
    """The parameters, with the defaults the product started with."""

    # Penalty points per severity, subtracted from the 100 points of a segment and slot.
    penalty_low: int = 10
    penalty_medium: int = 20
    penalty_high: int = 35
    # Level of a score: high from `threshold_high`, medium from `threshold_medium`, else low.
    threshold_high: int = 70
    threshold_medium: int = 40
    # An incident counts for this many days, and penalizes its hour plus or minus the margin.
    incident_window_days: int = 365
    incident_margin_minutes: int = 60
    time_zone: str = "America/Guayaquil"
    # "Near" a route, and the largest radius a search or a risk alert may use.
    nearby_radius_m: int = 500
    max_search_radius_m: int = 50_000
    max_alert_radius_m: int = 5000
    # Bounds that keep a route write plan well under the 500-writes limit.
    max_time_slots_per_route: int = 12
    max_segments_per_route: int = 50
    max_risk_factors_per_segment: int = 20
    # Limits of a route; the name length also bounds the name of a segment.
    route_name_max_length: int = 80
    route_description_max_length: int = 500
    route_max_distance_km: int = 500
    route_max_elevation_m: int = 10_000
    segment_max_points: int = 500
    # Ranges accepted in the sport profile of a runner.
    pace_min_sec_per_km: int = 150
    pace_max_sec_per_km: int = 1200
    distance_min_km: float = 1
    distance_max_km: float = 50
    # Safe routes within plus or minus this share of the requested distance, up to a maximum.
    safe_route_distance_tolerance: float = 0.2
    safe_route_max_distance_km: int = 500
    # Profile photo: the largest decoded image the API stores, and the side the clients resize to.
    profile_photo_max_kb: int = 100
    profile_photo_max_px: int = 256
    country_code: str = "EC"

    @classmethod
    def defaults(cls) -> "SystemSettings":
        return cls()

    @classmethod
    def parse(cls, raw: Mapping[str, object]) -> "SystemSettings":
        """Validated settings; every field is required. Raises with the reason of each bad one."""
        values, errors = cls._read(raw)
        errors.update(_cross_errors(values, errors))
        if errors:
            raise invalid_fields(errors)
        return cls(**values)

    @classmethod
    def from_document(cls, data: Mapping[str, object]) -> "SystemSettings":
        """Tolerant read: a missing or invalid field, or an inconsistent group, is a default."""
        defaults = cls()
        values, errors = cls._read(data)
        values.update({attr: getattr(defaults, attr) for attr in _failed_attrs(errors)})
        inconsistent = _cross_errors(values, {})
        for group in _GROUPS:
            if any(_KEYS[attr] in inconsistent for attr in group):
                values.update({attr: getattr(defaults, attr) for attr in group})
        return cls(**values)

    @classmethod
    def _read(cls, data: Mapping[str, object]) -> tuple[dict[str, object], dict[str, str]]:
        """The value of every field (the raw one when it is bad) and the reason of each bad key."""
        values: dict[str, object] = {}
        errors: dict[str, str] = {}
        for limit in _LIMITS:
            value = data.get(limit.key)
            values[limit.attr] = int(value) if limit.whole and _is_number(value) else value
            if reason := _limit_reason(value, limit):
                errors[limit.key] = reason
        text_reasons = (("time_zone", _time_zone_reason), ("country_code", _country_reason))
        for attr, reason_of in text_reasons:
            value = data.get(_TEXT_KEYS[attr])
            values[attr] = value
            if reason := reason_of(value):
                errors[_TEXT_KEYS[attr]] = reason
        return values, errors

    def to_document(self) -> dict[str, object]:
        return {_KEYS[field.name]: getattr(self, field.name) for field in fields(self)}

    def penalty_for(self, severity: str) -> int:
        return {"low": self.penalty_low, "medium": self.penalty_medium, "high": self.penalty_high}[
            severity
        ]

    def zone(self) -> ZoneInfo:
        return ZoneInfo(self.time_zone)

    def changes_safety(self, other: "SystemSettings") -> bool:
        """Whether `other` makes the stored safety of the routes stale."""
        return any(getattr(self, attr) != getattr(other, attr) for attr in _SAFETY_ATTRS)

    def with_changes(self, changes: Mapping[str, object]) -> "SystemSettings":
        """These settings with some fields (by document key) replaced; validated like `parse`."""
        return self.parse({**self.to_document(), **changes})


def _failed_attrs(errors: Mapping[str, str]) -> list[str]:
    return [attr for attr, key in _KEYS.items() if key in errors]


def _cross_errors(values: Mapping[str, object], known: Mapping[str, str]) -> dict[str, str]:
    """Order rules between fields that are valid on their own."""

    def ok(*attrs: str) -> bool:
        return not any(_KEYS[attr] in known for attr in attrs)

    errors: dict[str, str] = {}
    if ok("penalty_low", "penalty_medium") and values["penalty_medium"] < values["penalty_low"]:
        errors["penaltyMedium"] = "must-not-be-below-previous"
    if ok("penalty_medium", "penalty_high") and values["penalty_high"] < values["penalty_medium"]:
        errors["penaltyHigh"] = "must-not-be-below-previous"
    if ok("threshold_high", "threshold_medium") and (
        values["threshold_medium"] >= values["threshold_high"]
    ):
        errors["thresholdMedium"] = "must-be-below-high"
    if ok("pace_min_sec_per_km", "pace_max_sec_per_km") and (
        values["pace_max_sec_per_km"] <= values["pace_min_sec_per_km"]
    ):
        errors["paceMaxSecPerKm"] = "must-exceed-min"
    if ok("distance_min_km", "distance_max_km") and (
        values["distance_max_km"] <= values["distance_min_km"]
    ):
        errors["distanceMaxKm"] = "must-exceed-min"
    return errors
