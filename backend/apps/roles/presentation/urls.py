from django.urls import path

from apps.roles.presentation.views import RolesView, RoleView, UserRoleView

urlpatterns = [
    path("roles", RolesView.as_view()),
    path("roles/<str:role_id>", RoleView.as_view()),
    path("users/<str:uid>/role", UserRoleView.as_view()),
]
