from django.urls import path

from apps.health.presentation.views import HealthServicesView, HealthView

urlpatterns = [
    path("health", HealthView.as_view()),
    path("health/services", HealthServicesView.as_view()),
]
