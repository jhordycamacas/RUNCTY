from django.urls import include, path

urlpatterns = [
    path("api/v1/", include("apps.health.presentation.urls")),
    path("api/v1/", include("apps.identity.presentation.urls")),
    path("api/v1/", include("apps.users.presentation.urls")),
    path("api/v1/", include("apps.roles.presentation.urls")),
    path("api/v1/", include("apps.cities.presentation.urls")),
    path("api/v1/", include("apps.routes.presentation.urls")),
    path("api/v1/", include("apps.safety_data.presentation.urls")),
    path("api/v1/", include("apps.support_points.presentation.urls")),
    path("api/v1/", include("apps.risk_alerts.presentation.urls")),
    path("api/v1/", include("apps.safe_routes.presentation.urls")),
    path("api/v1/", include("apps.friends.presentation.urls")),
    path("api/v1/", include("apps.summary.presentation.urls")),
    path("api/v1/", include("apps.system_settings.presentation.urls")),
    path("api/v1/", include("apps.catalogs.presentation.urls")),
]

handler404 = "apps.shared.presentation.errors.not_found"
handler500 = "apps.shared.presentation.errors.server_error"
