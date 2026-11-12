"""Probe routes that exercise shared presentation code no real endpoint triggers."""

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from django.urls import path
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class RaisingProbe(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    error: Exception | None = None

    def get(self, request):
        raise self.error


class EchoProbe(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def post(self, request):
        return Response(request.data)


urlpatterns = [
    path("probe/echo", EchoProbe.as_view()),
    path(
        "probe/crash",
        RaisingProbe.as_view(error=RuntimeError("firebase credential /secrets/key.json failed")),
    ),
    path("probe/missing", RaisingProbe.as_view(error=Http404("No Route matches id 7"))),
    path("probe/forbidden", RaisingProbe.as_view(error=DjangoPermissionDenied("internal rule"))),
]
