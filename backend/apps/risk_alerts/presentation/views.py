"""RF-07-12 to RF-07-15: readable by any signed-in user; written with `routes.manage`."""

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.risk_alerts.application import use_cases
from apps.risk_alerts.application.use_cases import RiskAlertsDeps
from apps.risk_alerts.presentation.serializers import (
    AlertBodySerializer,
    AlertQuerySerializer,
    AlertSerializer,
)
from apps.routes.domain.time import local_now
from apps.routes.presentation.views import ReadSignedInWriteManage, changed, created
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.serializers import validated_body, validated_query
from apps.system_settings.presentation.current import current_settings


def _deps() -> RiskAlertsDeps:
    return RiskAlertsDeps(
        alerts=adapter("RISK_ZONE_ALERT_REPOSITORY"),
        cities=adapter("CITY_REPOSITORY"),
        routes=adapter("ROUTE_REPOSITORY"),
        settings=current_settings(),
    )


class RiskZoneAlertsView(ReadSignedInWriteManage, APIView):
    def get(self, request) -> Response:
        query = validated_query(AlertQuerySerializer, request)
        alerts = use_cases.list_alerts(
            query, local_now(current_settings()), adapter("RISK_ZONE_ALERT_REPOSITORY")
        )
        return Response({"alerts": AlertSerializer(alerts, many=True).data})

    def post(self, request) -> Response:
        body = validated_body(AlertBodySerializer, request)
        return created(request, "Risk zone alert", use_cases.create_alert(body, _deps()))


class RiskZoneAlertView(ReadSignedInWriteManage, APIView):
    def get(self, request, alert_id: str) -> Response:
        alert = use_cases.get_alert(alert_id, adapter("RISK_ZONE_ALERT_REPOSITORY"))
        return Response(AlertSerializer(alert).data)

    def put(self, request, alert_id: str) -> Response:
        body = validated_body(AlertBodySerializer, request)
        use_cases.update_alert(alert_id, body, _deps())
        return changed(request, "Risk zone alert", {"alert": alert_id}, "updated")

    def delete(self, request, alert_id: str) -> Response:
        use_cases.delete_alert(alert_id, adapter("RISK_ZONE_ALERT_REPOSITORY"))
        return changed(request, "Risk zone alert", {"alert": alert_id}, "deleted")
