from django.urls import path

from apps.identity.presentation.views import MeView

urlpatterns = [path("me", MeView.as_view())]
