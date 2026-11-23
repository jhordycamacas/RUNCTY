"""Models stored under `users/{uid}`. Attributes are snake_case, document fields camelCase.

`parse`, `register` and `with_personal_data` validate client input and raise an
`invalid-argument` domain error naming every rejected field. `from_document` reads what is
already stored and never raises.
"""

import math
import re
from collections.abc import Mapping
from dataclasses import dataclass, field, replace
from datetime import date

from apps.shared.domain.errors import DomainError, invalid_fields
from apps.system_settings.domain.models import SystemSettings

_MAX_NAME = 60
_MAX_CITY_ID = 64
_ISO_DATE = re.compile(r"[0-9]{4}-[0-9]{2}-[0-9]{2}")
_ID_NUMBER = re.compile(r"[0-9]{10}")
# TODO(product): minors are allowed for now. LOPDP requires parental consent for minors;
# how to collect it is an open decision (CONTEXTO.md, section 10).
_MIN_AGE = 5
_MAX_AGE = 110


def _text_reason(value: object, max_length: int) -> str | None:
    if value is None:
        return "required"
    if not isinstance(value, str):
        return "invalid"
    if not value.strip():
        return "required"
    return "max-length" if len(value.strip()) > max_length else None


def _birth_date_reason(value: object, today: date) -> str | None:
    """NEW-08: a real calendar day that gives an age between 5 and 110 years."""
    if value is None:
        return "required"
    if not isinstance(value, str):
        return "invalid"
    if not _ISO_DATE.fullmatch(value):
        return "invalid-format"
    try:
        birth = date.fromisoformat(value)
    except ValueError:
        return "invalid-date"
    before_birthday = (today.month, today.day) < (birth.month, birth.day)
    age = today.year - birth.year - before_birthday
    return None if birth < today and _MIN_AGE <= age <= _MAX_AGE else "out-of-range"


def _stored_text(value: object) -> str:
    return value if isinstance(value, str) else ""


@dataclass(frozen=True, slots=True)
class Usuario:
    """Document `users/{uid}`: the profile of an account (RF-01)."""

    uid: str
    email: str
    first_name: str
    last_name: str
    birth_date: str  # ISO `YYYY-MM-DD`
    city_id: str
    id_number: str | None = None  # optional Ecuadorian ID (cedula), 10 digits
    # Read-only mirror of the `role` custom claim; the claim is the authority.
    role: str | None = None

    @classmethod
    def register(cls, uid: str, email: str, data: Mapping[str, object], today: date) -> "Usuario":
        """The profile of a new account, from the sign-up form.

        `uid` and `email` come from the ID token. The account must accept the processing
        of its personal data (LOPDP) explicitly.
        """
        errors: dict[str, str] = {}
        personal_data = _personal_data(data, today, errors)
        consent = data.get("consent")
        if not isinstance(consent, Mapping) or consent.get("lopdp") is not True:
            errors["consent.lopdp"] = "not-accepted"
        if errors:
            raise invalid_fields(errors)
        return cls(uid=uid, email=email, **personal_data)

    def with_personal_data(self, changes: Mapping[str, object], today: date) -> "Usuario":
        """This profile with some personal data replaced (RF-01-3).

        Identity, email and role cannot change. An empty `idNumber` removes it.
        """
        errors: dict[str, str] = {}
        personal_data = _personal_data({**self._personal_document(), **changes}, today, errors)
        if errors:
            raise invalid_fields(errors)
        return replace(self, **personal_data)

    @classmethod
    def from_document(cls, uid: str, data: Mapping[str, object]) -> "Usuario":
        return cls(
            uid=uid,
            email=_stored_text(data.get("email")),
            first_name=_stored_text(data.get("firstName")),
            last_name=_stored_text(data.get("lastName")),
            birth_date=_stored_text(data.get("birthDate")),
            city_id=_stored_text(data.get("cityId")),
            id_number=_stored_text(data.get("idNumber")) or None,
            role=_stored_text(data.get("role")) or None,
        )

    def to_document(self) -> dict[str, object]:
        """The fields a client may set. `role`, consent and timestamps are the server's."""
        return {"uid": self.uid, "email": self.email, **self._personal_document()}

    def _personal_document(self) -> dict[str, object]:
        document: dict[str, object] = {
            "firstName": self.first_name,
            "lastName": self.last_name,
            "birthDate": self.birth_date,
            "cityId": self.city_id,
        }
        if self.id_number is not None:
            document["idNumber"] = self.id_number
        return document


def _personal_data(
    data: Mapping[str, object], today: date, errors: dict[str, str]
) -> dict[str, str | None]:
    """Validated `Usuario` attributes from `data`; adds the reason of each bad field."""
    reasons = {
        "firstName": _text_reason(data.get("firstName"), _MAX_NAME),
        "lastName": _text_reason(data.get("lastName"), _MAX_NAME),
        "birthDate": _birth_date_reason(data.get("birthDate"), today),
        "cityId": _text_reason(data.get("cityId"), _MAX_CITY_ID),
    }
    id_number = data.get("idNumber") or None
    if id_number is not None and not (
        isinstance(id_number, str) and _ID_NUMBER.fullmatch(id_number.strip())
    ):
        reasons["idNumber"] = "invalid-format"
    errors.update({name: reason for name, reason in reasons.items() if reason})
    if errors:
        return {}
    return {
        "first_name": data["firstName"].strip(),
        "last_name": data["lastName"].strip(),
        "birth_date": data["birthDate"],
        "city_id": data["cityId"].strip(),
        "id_number": id_number.strip() if id_number else None,
    }


SPORT_LEVELS = ("beginner", "intermediate", "advanced")
SPORT_GOALS = ("health", "weightLoss", "racePrep", "pace", "social")


def _number_reason(value: object, limits: tuple[float, float] | None) -> str | None:
    """`limits` is None when reading a stored profile: the ranges apply when it is saved."""
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return "invalid"
    if limits is None:
        return None if math.isfinite(value) else "invalid"
    # Written so that NaN, which compares false to everything, is rejected.
    return None if limits[0] <= value <= limits[1] else "out-of-range"


def _goals_reason(value: object) -> str | None:
    if not isinstance(value, (list, tuple)):
        return "invalid"
    if not value:
        return "required"
    if len(value) > len(SPORT_GOALS):
        return "max-length"
    return None if all(goal in SPORT_GOALS for goal in value) else "invalid-choice"


@dataclass(frozen=True, slots=True)
class PerfilDeportivo:
    """Document `users/{uid}/private/sportProfile` (RF-01-9..12)."""

    level: str
    goals: tuple[str, ...]
    usual_pace_sec_per_km: float
    preferred_distance_km: float

    @classmethod
    def parse(cls, raw: Mapping[str, object], settings: SystemSettings | None) -> "PerfilDeportivo":
        """Validated profile. `settings` gives the pace and distance ranges; None skips them."""
        pace = distance = None
        if settings is not None:
            pace = (settings.pace_min_sec_per_km, settings.pace_max_sec_per_km)
            distance = (settings.distance_min_km, settings.distance_max_km)
        reasons = {
            "level": None if raw.get("level") in SPORT_LEVELS else "invalid-choice",
            "goals": _goals_reason(raw.get("goals")),
            "usualPaceSecPerKm": _number_reason(raw.get("usualPaceSecPerKm"), pace),
            "preferredDistanceKm": _number_reason(raw.get("preferredDistanceKm"), distance),
        }
        errors = {name: reason for name, reason in reasons.items() if reason}
        if errors:
            raise invalid_fields(errors)
        return cls(
            level=raw["level"],
            goals=tuple(raw["goals"]),
            usual_pace_sec_per_km=raw["usualPaceSecPerKm"],
            preferred_distance_km=raw["preferredDistanceKm"],
        )

    @classmethod
    def from_document(cls, data: Mapping[str, object]) -> "PerfilDeportivo | None":
        """A stored profile that no longer matches the schema is treated as missing.

        The ranges of the system settings are not applied: narrowing them never hides a profile.
        """
        try:
            return cls.parse(data, None)
        except DomainError:
            return None

    def to_document(self) -> dict[str, object]:
        return {
            "level": self.level,
            "goals": list(self.goals),
            "usualPaceSecPerKm": self.usual_pace_sec_per_km,
            "preferredDistanceKm": self.preferred_distance_km,
        }


# Only Spanish for now: the interface is Spanish-only.
LANGUAGES = ("es",)
FONT_SCALES = ("small", "normal", "large", "xlarge")
APPEARANCES = ("system", "light", "dark")
UNIT_SYSTEMS = ("metric", "imperial")
LOCATION_PRIVACY_OPTIONS = ("trustedContactsDuringSession", "off")


@dataclass(frozen=True, slots=True)
class PreferenciaNotificaciones:
    enabled: bool = True
    safety_alerts: bool = True
    events: bool = True


@dataclass(frozen=True, slots=True)
class PreferenciaUsuario:
    """Document `users/{uid}/private/preferences` (RF-01-13..16).

    The field defaults are the preferences of an account that never saved any.
    """

    language: str = "es"
    font_scale: str = "normal"
    appearance: str = "light"
    units: str = "metric"
    notifications: PreferenciaNotificaciones = field(default_factory=PreferenciaNotificaciones)
    location_privacy: str = "trustedContactsDuringSession"

    @classmethod
    def parse(cls, raw: Mapping[str, object]) -> "PreferenciaUsuario":
        preferences, errors = cls._read(raw)
        if errors:
            raise invalid_fields(errors)
        return preferences

    @classmethod
    def from_document(cls, data: Mapping[str, object]) -> "PreferenciaUsuario":
        """Tolerant read: every missing or invalid stored field falls back to its default."""
        return cls._read(data)[0]

    @classmethod
    def _read(cls, data: Mapping[str, object]) -> tuple["PreferenciaUsuario", dict[str, str]]:
        defaults = cls()
        errors: dict[str, str] = {}

        def choice(name: str, choices: tuple[str, ...], default: str) -> str:
            value = data.get(name)
            if isinstance(value, str) and value in choices:
                return value
            errors[name] = "invalid-choice"
            return default

        notifications = data.get("notifications")
        if not isinstance(notifications, Mapping):
            errors["notifications"] = "invalid"

        def flag(name: str, default: bool) -> bool:
            if not isinstance(notifications, Mapping):
                return default
            value = notifications.get(name)
            if isinstance(value, bool):
                return value
            errors[f"notifications.{name}"] = "invalid"
            return default

        preferences = cls(
            language=choice("language", LANGUAGES, defaults.language),
            font_scale=choice("fontScale", FONT_SCALES, defaults.font_scale),
            appearance=choice("appearance", APPEARANCES, defaults.appearance),
            units=choice("units", UNIT_SYSTEMS, defaults.units),
            notifications=PreferenciaNotificaciones(
                enabled=flag("enabled", defaults.notifications.enabled),
                safety_alerts=flag("safetyAlerts", defaults.notifications.safety_alerts),
                events=flag("events", defaults.notifications.events),
            ),
            location_privacy=choice(
                "locationPrivacy", LOCATION_PRIVACY_OPTIONS, defaults.location_privacy
            ),
        )
        return preferences, errors

    def to_document(self) -> dict[str, object]:
        return {
            "language": self.language,
            "fontScale": self.font_scale,
            "appearance": self.appearance,
            "units": self.units,
            "notifications": {
                "enabled": self.notifications.enabled,
                "safetyAlerts": self.notifications.safety_alerts,
                "events": self.notifications.events,
            },
            "locationPrivacy": self.location_privacy,
        }
