from django.urls import path

from apps.support_points.presentation.views import (
    GuardedTrailsView,
    GuardedTrailView,
    SupportPointsView,
    SupportPointView,
)

urlpatterns = [
    path("support-points", SupportPointsView.as_view()),
    path("support-points/<str:point_id>", SupportPointView.as_view()),
    path("guarded-trails", GuardedTrailsView.as_view()),
    path("guarded-trails/<str:trail_id>", GuardedTrailView.as_view()),
]
