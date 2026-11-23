import logging

from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.permissions import HasPermission, IsAuthenticated
from apps.shared.presentation.serializers import validated_body
from apps.shared.presentation.throttles import SENSITIVE_THROTTLES, SensitiveWritesMixin
from apps.system_settings.application import use_cases
from apps.system_settings.application.use_cases import SettingsDeps
from apps.system_settings.presentation.serializers import SettingsBodySerializer

logger = logging.getLogger(__name__)

CanManageSettings = HasPermission("settings.manage")


def _deps() -> SettingsDeps:
    return SettingsDeps(settings=adapter("SETTINGS_REPOSITORY"), routes=adapter("ROUTE_REPOSITORY"))


class SettingsView(SensitiveWritesMixin, APIView):
    """`GET`: every signed-in user reads the parameters (the clients validate with them);
    `PUT` needs `settings.manage`."""

    def get_permissions(self):
        return [IsAuthenticated() if self.request.method in SAFE_METHODS else CanManageSettings()]

    def get(self, request) -> Response:
        settings = use_cases.get_settings(adapter("SETTINGS_REPOSITORY"))
        return Response({"settings": settings.to_document()})

    def put(self, request) -> Response:
        patch = validated_body(SettingsBodySerializer, request)
        result = use_cases.update_settings(patch, _deps())
        logger.info(
            "System settings updated by %s (%s routes recalculated)",
            request.user.uid,
            result.recalculated,
        )
        body = {"settings": result.settings.to_document(), "recalculated": result.recalculated}
        return Response(body)


class RecalculateRoutesView(APIView):
    permission_classes = [CanManageSettings]
    throttle_classes = SENSITIVE_THROTTLES

    def post(self, request) -> Response:
        recalculated = use_cases.recalculate_routes(_deps())
        logger.info("%s routes recalculated by %s", recalculated, request.user.uid)
        return Response({"recalculated": recalculated})
