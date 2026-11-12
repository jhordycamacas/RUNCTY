from django.urls import include, path

urlpatterns = [
    path("api/v1/", include("apps.health.presentation.urls")),
    path("api/v1/", include("apps.identity.presentation.urls")),
    path("api/v1/", include("apps.users.presentation.urls")),
    path("api/v1/", include("apps.roles.presentation.urls")),
]

handler404 = "apps.shared.presentation.errors.not_found"
handler500 = "apps.shared.presentation.errors.server_error"
