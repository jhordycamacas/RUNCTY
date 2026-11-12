"""Probe routes that exercise shared presentation code no real endpoint triggers yet."""

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from django.urls import path
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shared.domain.errors import DomainError, ErrorKind
from apps.shared.presentation.permissions import HasPermission


class UsersReadProbe(APIView):
    permission_classes = [HasPermission("users.read")]

    def get(self, request):
        return Response({"ok": True})


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


class DomainErrorProbe(RaisingProbe):
    def get(self, request, kind):
        raise DomainError(ErrorKind(kind), "probe-reason", "Probe message.")


urlpatterns = [
    path("probe/echo", EchoProbe.as_view()),
    path("probe/users-read", UsersReadProbe.as_view()),
    path("probe/domain-error/<str:kind>", DomainErrorProbe.as_view()),
    path(
        "probe/crash",
        RaisingProbe.as_view(error=RuntimeError("firebase credential /secrets/key.json failed")),
    ),
    path("probe/missing", RaisingProbe.as_view(error=Http404("No Route matches id 7"))),
    path("probe/forbidden", RaisingProbe.as_view(error=DjangoPermissionDenied("internal rule"))),
    path("probe/validation", RaisingProbe.as_view(error=ValidationError({"name": ["required"]}))),
]
