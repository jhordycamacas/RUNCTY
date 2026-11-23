from django.urls import path

from apps.system_settings.presentation.views import RecalculateRoutesView, SettingsView

urlpatterns = [
    path("settings", SettingsView.as_view()),
    path("admin/recalculate-routes", RecalculateRoutesView.as_view()),
]
