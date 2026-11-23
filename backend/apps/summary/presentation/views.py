from datetime import datetime, timezone

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.permissions import HasPermission
from apps.shared.presentation.serializers import StrictSerializer, validated_query
from apps.summary.application.use_cases import SummaryDeps, get_summary


class SummaryQuerySerializer(StrictSerializer):
    """The summary takes no parameters."""


class SummaryView(APIView):
    """`GET /admin/summary`: aggregates only; each block follows the caller's permissions."""

    permission_classes = [HasPermission("admin.access")]

    def get(self, request) -> Response:
        validated_query(SummaryQuerySerializer, request)
        deps = SummaryDeps(
            source=adapter("SUMMARY_SOURCE"),
            cities=adapter("CITY_REPOSITORY"),
            settings=adapter("SETTINGS_REPOSITORY"),
        )
        return Response(get_summary(request.user, deps, datetime.now(timezone.utc)))
