from django.urls import path

from apps.safe_routes.presentation.views import SafeRouteRequestsView, SafeRouteRequestView

urlpatterns = [
    path("safe-route-requests", SafeRouteRequestsView.as_view()),
    path("safe-route-requests/<str:request_id>", SafeRouteRequestView.as_view()),
]
