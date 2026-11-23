from django.urls import path

from apps.catalogs.presentation.views import CatalogView

urlpatterns = [path("catalogs/<str:catalog_id>", CatalogView.as_view())]
