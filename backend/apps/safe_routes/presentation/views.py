"""EP-09: any signed-in runner, on their own requests only (`request.user.uid`)."""

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.routes.domain.time import local_now
from apps.safe_routes.application import use_cases
from apps.safe_routes.application.use_cases import SafeRoutesDeps
from apps.safe_routes.presentation.serializers import (
    RequestBodySerializer,
    RequestSerializer,
    recommended_routes_data,
)
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.serializers import validated_body
from apps.system_settings.presentation.current import current_settings

logger = logging.getLogger(__name__)


def _deps() -> SafeRoutesDeps:
    return SafeRoutesDeps(
        requests=adapter("SAFE_ROUTE_REQUEST_REPOSITORY"),
        routes=adapter("ROUTE_REPOSITORY"),
        cities=adapter("CITY_REPOSITORY"),
        settings=current_settings(),
    )


class SafeRouteRequestsView(APIView):
    def get(self, request) -> Response:
        found = use_cases.list_requests(request.user.uid, adapter("SAFE_ROUTE_REQUEST_REPOSITORY"))
        return Response({"requests": RequestSerializer(found, many=True).data})

    def post(self, request) -> Response:
        body = validated_body(RequestBodySerializer, request)
        deps = _deps()
        result = use_cases.create_request(body, request.user.uid, local_now(deps.settings), deps)
        logger.info("Safe route request %s created by %s", result.request.id, request.user.uid)
        # Extends the usual `201 {id}` with the recommendation, saving a second call.
        return Response(
            {"id": result.request.id, "routes": recommended_routes_data(result)},
            status=status.HTTP_201_CREATED,
        )


class SafeRouteRequestView(APIView):
    def get(self, request, request_id: str) -> Response:
        result = use_cases.get_request(request_id, request.user.uid, _deps())
        return Response(
            {**RequestSerializer(result.request).data, "routes": recommended_routes_data(result)}
        )

    def delete(self, request, request_id: str) -> Response:
        use_cases.delete_request(
            request_id, request.user.uid, adapter("SAFE_ROUTE_REQUEST_REPOSITORY")
        )
        logger.info("Safe route request %s deleted by %s", request_id, request.user.uid)
        return Response(status=status.HTTP_204_NO_CONTENT)
