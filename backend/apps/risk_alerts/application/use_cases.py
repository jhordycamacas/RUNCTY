"""RF-07-12 to RF-07-15: risk zone alerts.

Reads need a signed-in user; changes need `routes.manage`, both checked by the presentation
layer. Runners ask for the alerts in force (`active`) on the local wall clock.
"""

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime

from apps.cities.application.ports import CityRepository
from apps.cities.domain.models import parse_city_id
from apps.risk_alerts.application.ports import RiskZoneAlertRepository
from apps.risk_alerts.domain.models import ALERT_SEVERITIES, AlertaZonaRiesgo
from apps.routes.application.ports import RouteRepository
from apps.routes.domain.models import parse_doc_id
from apps.shared.domain.errors import DomainError, ErrorKind


@dataclass(frozen=True, slots=True)
class RiskAlertsDeps:
    alerts: RiskZoneAlertRepository
    cities: CityRepository
    routes: RouteRepository


def _not_found(reason: str, message: str) -> DomainError:
    return DomainError(ErrorKind.NOT_FOUND, reason, message)


def list_alerts(
    query: Mapping[str, object], now: datetime, alerts: RiskZoneAlertRepository
) -> list[AlertaZonaRiesgo]:
    """RF-07-13: by city or zone and route, only those in force with `active`; the most severe
    first, then the newest."""
    city_id = query.get("cityId")
    route_id = query.get("routeId")
    route_id = None if route_id is None else parse_doc_id(route_id, "invalid-route-id")
    found = [
        alert
        for alert in alerts.list(None if city_id is None else parse_city_id(city_id))
        if (route_id is None or alert.route_id == route_id)
        and (not query.get("active") or alert.is_active(now))
    ]
    found.sort(key=lambda alert: (alert.valid_from, alert.id), reverse=True)
    return sorted(found, key=lambda alert: ALERT_SEVERITIES.index(alert.severity))


def _require_alert(raw_id: object, alerts: RiskZoneAlertRepository) -> AlertaZonaRiesgo:
    alert_id = parse_doc_id(raw_id, "invalid-alert-id")
    alert = alerts.get(alert_id)
    if alert is None:
        raise _not_found("alert-not-found", f'Alert "{alert_id}" does not exist.')
    return alert


def get_alert(raw_id: object, alerts: RiskZoneAlertRepository) -> AlertaZonaRiesgo:
    return _require_alert(raw_id, alerts)


def _save(alert: AlertaZonaRiesgo, deps: RiskAlertsDeps) -> None:
    if deps.cities.get(alert.city_id) is None:
        raise _not_found("city-not-found", f'City or zone "{alert.city_id}" does not exist.')
    if alert.route_id is not None and deps.routes.get(alert.route_id) is None:
        raise _not_found("route-not-found", f'Route "{alert.route_id}" does not exist.')
    deps.alerts.save(alert)


def create_alert(raw: object, deps: RiskAlertsDeps) -> str:
    alert = AlertaZonaRiesgo.parse(raw, deps.alerts.new_id())
    _save(alert, deps)
    return alert.id


def update_alert(raw_id: object, raw: object, deps: RiskAlertsDeps) -> None:
    current = _require_alert(raw_id, deps.alerts)
    _save(AlertaZonaRiesgo.parse(raw, current.id), deps)


def delete_alert(raw_id: object, alerts: RiskZoneAlertRepository) -> None:
    """RF-07-15: the clients confirm first; the alert stops being shown."""
    alerts.delete(_require_alert(raw_id, alerts).id)
