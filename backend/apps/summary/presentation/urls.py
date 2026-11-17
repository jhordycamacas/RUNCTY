from django.urls import path

from apps.summary.presentation.views import SummaryView

urlpatterns = [path("admin/summary", SummaryView.as_view())]
