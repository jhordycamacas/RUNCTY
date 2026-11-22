"""EP-06: readable by any signed-in user (runner or admin); written with `routes.manage`."""

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.routes.presentation.views import ReadSignedInWriteManage, changed, created
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.serializers import validated_body, validated_query
from apps.support_points.application import use_cases
from apps.support_points.application.use_cases import SupportPointsDeps
from apps.support_points.presentation.serializers import (
    GuardedTrailBodySerializer,
    GuardedTrailQuerySerializer,
    GuardedTrailSerializer,
    SupportPointBodySerializer,
    SupportPointQuerySerializer,
    SupportPointSerializer,
)


def _deps() -> SupportPointsDeps:
    return SupportPointsDeps(
        points=adapter("SUPPORT_POINT_REPOSITORY"),
        trails=adapter("GUARDED_TRAIL_REPOSITORY"),
        routes=adapter("ROUTE_REPOSITORY"),
        cities=adapter("CITY_REPOSITORY"),
    )


class SupportPointsView(ReadSignedInWriteManage, APIView):
    def get(self, request) -> Response:
        query = validated_query(SupportPointQuerySerializer, request)
        points = use_cases.list_support_points(query, _deps())
        return Response({"supportPoints": SupportPointSerializer(points, many=True).data})

    def post(self, request) -> Response:
        body = validated_body(SupportPointBodySerializer, request)
        return created(request, "Support point", use_cases.create_support_point(body, _deps()))


class SupportPointView(ReadSignedInWriteManage, APIView):
    def get(self, request, point_id: str) -> Response:
        point = use_cases.get_support_point(point_id, adapter("SUPPORT_POINT_REPOSITORY"))
        return Response(SupportPointSerializer(point).data)

    def put(self, request, point_id: str) -> Response:
        body = validated_body(SupportPointBodySerializer, request)
        use_cases.update_support_point(point_id, body, _deps())
        return changed(request, "Support point", {"supportPoint": point_id}, "updated")

    def delete(self, request, point_id: str) -> Response:
        use_cases.delete_support_point(point_id, adapter("SUPPORT_POINT_REPOSITORY"))
        return changed(request, "Support point", {"supportPoint": point_id}, "deleted")


class GuardedTrailsView(ReadSignedInWriteManage, APIView):
    def get(self, request) -> Response:
        query = validated_query(GuardedTrailQuerySerializer, request)
        trails = use_cases.list_guarded_trails(
            query.get("routeId"), adapter("GUARDED_TRAIL_REPOSITORY")
        )
        return Response({"guardedTrails": GuardedTrailSerializer(trails, many=True).data})

    def post(self, request) -> Response:
        body = validated_body(GuardedTrailBodySerializer, request)
        return created(request, "Guarded trail", use_cases.create_guarded_trail(body, _deps()))


class GuardedTrailView(ReadSignedInWriteManage, APIView):
    def get(self, request, trail_id: str) -> Response:
        trail = use_cases.get_guarded_trail(trail_id, adapter("GUARDED_TRAIL_REPOSITORY"))
        return Response(GuardedTrailSerializer(trail).data)

    def put(self, request, trail_id: str) -> Response:
        body = validated_body(GuardedTrailBodySerializer, request)
        use_cases.update_guarded_trail(trail_id, body, _deps())
        return changed(request, "Guarded trail", {"guardedTrail": trail_id}, "updated")

    def delete(self, request, trail_id: str) -> Response:
        use_cases.delete_guarded_trail(trail_id, adapter("GUARDED_TRAIL_REPOSITORY"))
        return changed(request, "Guarded trail", {"guardedTrail": trail_id}, "deleted")
