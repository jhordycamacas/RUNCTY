from django.urls import path

from apps.cities.presentation.views import CitiesView, CityView

urlpatterns = [
    path("cities", CitiesView.as_view()),
    path("cities/<str:city_id>", CityView.as_view()),
]
