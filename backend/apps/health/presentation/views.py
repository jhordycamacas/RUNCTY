from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.health.application.ports import GoogleServicesProbe
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.permissions import IsAdmin


class HealthView(APIView):
    """Public liveness probe. Authentication is skipped so a stale token cannot fail it."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request) -> Response:
        return Response({"status": "ok"})


class HealthServicesView(APIView):
    """Which Google services are configured. Booleans only: never secrets or paths."""

    permission_classes = [IsAdmin]

    def get(self, request) -> Response:
        probe: GoogleServicesProbe = adapter("GOOGLE_SERVICES_PROBE")
        return Response({"services": probe.configured_services()})
