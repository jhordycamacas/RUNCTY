from django.urls import path

from apps.routes.presentation.views import (
    RiskFactorsView,
    RiskFactorView,
    RouteImageView,
    RoutesView,
    RouteView,
    SegmentsView,
    SegmentView,
    TimeSlotsView,
    TimeSlotView,
)

urlpatterns = [
    path("routes", RoutesView.as_view()),
    path("routes/<str:route_id>", RouteView.as_view()),
    path("routes/<str:route_id>/image", RouteImageView.as_view()),
    path("routes/<str:route_id>/segments", SegmentsView.as_view()),
    path("routes/<str:route_id>/segments/<str:segment_id>", SegmentView.as_view()),
    path("routes/<str:route_id>/time-slots", TimeSlotsView.as_view()),
    path("routes/<str:route_id>/time-slots/<str:slot_id>", TimeSlotView.as_view()),
    path("routes/<str:route_id>/segments/<str:segment_id>/risk-factors", RiskFactorsView.as_view()),
    path(
        "routes/<str:route_id>/segments/<str:segment_id>/risk-factors/<str:factor_id>",
        RiskFactorView.as_view(),
    ),
]
