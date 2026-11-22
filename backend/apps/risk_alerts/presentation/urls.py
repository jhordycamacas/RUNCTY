from django.urls import path

from apps.risk_alerts.presentation.views import RiskZoneAlertsView, RiskZoneAlertView

urlpatterns = [
    path("risk-zone-alerts", RiskZoneAlertsView.as_view()),
    path("risk-zone-alerts/<str:alert_id>", RiskZoneAlertView.as_view()),
]
