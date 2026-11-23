import logging

from rest_framework import status
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.routes.application import use_cases
from apps.routes.application.use_cases import RoutesDeps
from apps.routes.presentation.serializers import (
    RiskFactorBodySerializer,
    RouteBodySerializer,
    RouteListItemSerializer,
    RouteQuerySerializer,
    SegmentBodySerializer,
    TimeSlotBodySerializer,
    route_detail_data,
)
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.permissions import HasPermission, IsAuthenticated
from apps.shared.presentation.serializers import validated_body, validated_query
from apps.shared.presentation.throttles import SENSITIVE_THROTTLES, SensitiveWritesMixin
from apps.system_settings.presentation.current import current_settings

logger = logging.getLogger(__name__)

ROUTES_MANAGE = "routes.manage"
CanManageRoutes = HasPermission(ROUTES_MANAGE)


def _deps() -> RoutesDeps:
    return RoutesDeps(
        routes=adapter("ROUTE_REPOSITORY"),
        cities=adapter("CITY_REPOSITORY"),
        settings=current_settings(),
    )


def _can_manage(request) -> bool:
    return request.user.has_permission(ROUTES_MANAGE)


def created(request, what: str, created_id: str) -> Response:
    logger.info("%s %s created by %s", what, created_id, request.user.uid)
    return Response({"id": created_id}, status=status.HTTP_201_CREATED)


def changed(request, what: str, ids: dict[str, str], verb: str) -> Response:
    logger.info("%s %s %s by %s", what, ids, verb, request.user.uid)
    return Response(status=status.HTTP_204_NO_CONTENT)


class ReadSignedInWriteManage(SensitiveWritesMixin):
    """Reads need a signed-in user; changes need `routes.manage` and the tighter rate limit."""

    def get_permissions(self):
        return [IsAuthenticated() if self.request.method in SAFE_METHODS else CanManageRoutes()]


class ManageOnly:
    permission_classes = [CanManageRoutes]
    throttle_classes = SENSITIVE_THROTTLES


class RoutesView(ReadSignedInWriteManage, APIView):
    def get(self, request) -> Response:
        query = validated_query(RouteQuerySerializer, request)
        routes = use_cases.list_routes(
            query.get("cityId"), _can_manage(request), adapter("ROUTE_REPOSITORY")
        )
        return Response({"routes": RouteListItemSerializer(routes, many=True).data})

    def post(self, request) -> Response:
        route_id = use_cases.create_route(validated_body(RouteBodySerializer, request), _deps())
        return created(request, "Route", route_id)


class RouteView(ReadSignedInWriteManage, APIView):
    def get(self, request, route_id: str) -> Response:
        detail = use_cases.get_route(route_id, _can_manage(request), adapter("ROUTE_REPOSITORY"))
        return Response(route_detail_data(detail))

    def put(self, request, route_id: str) -> Response:
        body = {**validated_body(RouteBodySerializer, request), "id": route_id}
        use_cases.update_route(body, _deps())
        return changed(request, "Route", {"route": route_id}, "updated")

    def delete(self, request, route_id: str) -> Response:
        use_cases.delete_route({"id": route_id}, _deps())
        return changed(request, "Route", {"route": route_id}, "deleted")


class SegmentsView(ManageOnly, APIView):
    def post(self, request, route_id: str) -> Response:
        body = {**validated_body(SegmentBodySerializer, request), "routeId": route_id}
        return created(request, "Segment", use_cases.create_segment(body, _deps()))


class SegmentView(ManageOnly, APIView):
    def put(self, request, route_id: str, segment_id: str) -> Response:
        ids = {"routeId": route_id, "segmentId": segment_id}
        use_cases.update_segment({**validated_body(SegmentBodySerializer, request), **ids}, _deps())
        return changed(request, "Segment", ids, "updated")

    def delete(self, request, route_id: str, segment_id: str) -> Response:
        ids = {"routeId": route_id, "segmentId": segment_id}
        use_cases.delete_segment(ids, _deps())
        return changed(request, "Segment", ids, "deleted")


class TimeSlotsView(ManageOnly, APIView):
    def post(self, request, route_id: str) -> Response:
        body = {**validated_body(TimeSlotBodySerializer, request), "routeId": route_id}
        return created(request, "Time slot", use_cases.create_time_slot(body, _deps()))


class TimeSlotView(ManageOnly, APIView):
    def put(self, request, route_id: str, slot_id: str) -> Response:
        ids = {"routeId": route_id, "slotId": slot_id}
        body = {**validated_body(TimeSlotBodySerializer, request), **ids}
        use_cases.update_time_slot(body, _deps())
        return changed(request, "Time slot", ids, "updated")

    def delete(self, request, route_id: str, slot_id: str) -> Response:
        ids = {"routeId": route_id, "slotId": slot_id}
        use_cases.delete_time_slot(ids, _deps())
        return changed(request, "Time slot", ids, "deleted")


class RiskFactorsView(ManageOnly, APIView):
    def post(self, request, route_id: str, segment_id: str) -> Response:
        ids = {"routeId": route_id, "segmentId": segment_id}
        body = {**validated_body(RiskFactorBodySerializer, request), **ids}
        return created(request, "Risk factor", use_cases.create_risk_factor(body, _deps()))


class RiskFactorView(ManageOnly, APIView):
    def put(self, request, route_id: str, segment_id: str, factor_id: str) -> Response:
        ids = {"routeId": route_id, "segmentId": segment_id, "factorId": factor_id}
        body = {**validated_body(RiskFactorBodySerializer, request), **ids}
        use_cases.update_risk_factor(body, _deps())
        return changed(request, "Risk factor", ids, "updated")

    def delete(self, request, route_id: str, segment_id: str, factor_id: str) -> Response:
        ids = {"routeId": route_id, "segmentId": segment_id, "factorId": factor_id}
        use_cases.delete_risk_factor(ids, _deps())
        return changed(request, "Risk factor", ids, "deleted")
