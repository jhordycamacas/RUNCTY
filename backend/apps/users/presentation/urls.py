from django.urls import path

from apps.users.presentation.views import (
    OwnPreferencesView,
    OwnProfileView,
    OwnSportProfileView,
    UsersView,
)

urlpatterns = [
    path("users", UsersView.as_view()),
    path("users/me", OwnProfileView.as_view()),
    path("users/me/sport-profile", OwnSportProfileView.as_view()),
    path("users/me/preferences", OwnPreferencesView.as_view()),
]
