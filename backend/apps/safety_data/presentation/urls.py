from django.urls import path

from apps.safety_data.presentation.views import (
    InformationSourcesView,
    InformationSourceView,
    SafetyIncidentsView,
    SafetyIncidentView,
)

urlpatterns = [
    path("information-sources", InformationSourcesView.as_view()),
    path("information-sources/<str:source_id>", InformationSourceView.as_view()),
    path("safety-incidents", SafetyIncidentsView.as_view()),
    path("safety-incidents/<str:incident_id>", SafetyIncidentView.as_view()),
]
