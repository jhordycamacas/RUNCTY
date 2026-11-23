"""EP-09: safe route requests. Each runner reads and deletes only their own requests; the
recommendation runs on the server, on the catalogue and its stored safety index."""

from dataclasses import dataclass
from datetime import datetime

from apps.cities.application.ports import CityRepository
from apps.routes.application.ports import RouteRepository
from apps.routes.domain.models import parse_doc_id
from apps.safe_routes.application.ports import SafeRouteRequestRepository
from apps.safe_routes.domain.models import RutaRecomendada, SolicitudRutaSegura, recommend
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.system_settings.domain.models import SystemSettings


@dataclass(frozen=True, slots=True)
class SafeRoutesDeps:
    requests: SafeRouteRequestRepository
    routes: RouteRepository
    cities: CityRepository
    settings: SystemSettings


@dataclass(frozen=True, slots=True)
class RecommendationResult:
    request: SolicitudRutaSegura
    routes: list[RutaRecomendada]


def _recommendation(request: SolicitudRutaSegura, deps: SafeRoutesDeps) -> RecommendationResult:
    routes = deps.routes.list(request.city_id)
    return RecommendationResult(request, recommend(routes, request, deps.settings))


def _require_own(
    raw_id: object, uid: str, requests: SafeRouteRequestRepository
) -> SolicitudRutaSegura:
    """Someone else's request does not exist for the caller."""
    request_id = parse_doc_id(raw_id, "invalid-request-id")
    request = requests.get(request_id)
    if request is None or request.uid != uid:
        raise DomainError(
            ErrorKind.NOT_FOUND,
            "safe-route-request-not-found",
            f'Safe route request "{request_id}" does not exist.',
        )
    return request


def create_request(
    raw: object, uid: str, now: datetime, deps: SafeRoutesDeps
) -> RecommendationResult:
    """RF-09-1: the city must be enabled (active coverage) and the distance above zero."""
    request = SolicitudRutaSegura.parse(raw, deps.requests.new_id(), uid, now, deps.settings)
    city = deps.cities.get(request.city_id)
    if city is None:
        raise DomainError(
            ErrorKind.NOT_FOUND, "city-not-found", f'City "{request.city_id}" does not exist.'
        )
    if city.coverage != "active":
        raise DomainError(
            ErrorKind.FAILED_PRECONDITION, "city-not-enabled", "The city is not enabled."
        )
    deps.requests.save(request)
    return _recommendation(request, deps)


def list_requests(uid: str, requests: SafeRouteRequestRepository) -> list[SolicitudRutaSegura]:
    """RF-09-2: the caller's requests, the newest first."""
    return sorted(requests.of_runner(uid), key=lambda r: (r.created_at, r.id), reverse=True)


def get_request(raw_id: object, uid: str, deps: SafeRoutesDeps) -> RecommendationResult:
    """RF-09-2: one of the caller's requests, with the recommendation recomputed now."""
    return _recommendation(_require_own(raw_id, uid, deps.requests), deps)


def delete_request(raw_id: object, uid: str, requests: SafeRouteRequestRepository) -> None:
    """RF-09-3: only the owner; the clients confirm first."""
    requests.delete(_require_own(raw_id, uid, requests).id)
