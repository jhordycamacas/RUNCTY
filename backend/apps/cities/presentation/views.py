import logging

from rest_framework import status
from rest_framework.permissions import SAFE_METHODS, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.cities.application.use_cases import (
    CitiesDeps,
    create_city,
    delete_city,
    list_cities,
    update_city,
)
from apps.cities.presentation.serializers import (
    CityCreateSerializer,
    CityQuerySerializer,
    CitySerializer,
    CityUpdateSerializer,
)
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.permissions import HasPermission
from apps.shared.presentation.serializers import validated_body, validated_query
from apps.shared.presentation.throttles import SENSITIVE_THROTTLES, SensitiveWritesMixin
from apps.system_settings.presentation.current import current_settings

logger = logging.getLogger(__name__)

CanManageCities = HasPermission("cities.manage")


def _deps() -> CitiesDeps:
    return CitiesDeps(
        cities=adapter("CITY_REPOSITORY"),
        usage=adapter("CITY_USAGE"),
        settings=current_settings(),
    )


class CitiesView(SensitiveWritesMixin, APIView):
    """`GET` is the public catalogue (the sign-up form lists it); `POST` needs `cities.manage`."""

    def get_permissions(self):
        return [AllowAny() if self.request.method in SAFE_METHODS else CanManageCities()]

    def get(self, request) -> Response:
        query = validated_query(CityQuerySerializer, request)
        cities = list_cities(query.get("coverage"), adapter("CITY_REPOSITORY"))
        return Response({"cities": CitySerializer(cities, many=True).data})

    def post(self, request) -> Response:
        city = create_city(validated_body(CityCreateSerializer, request), _deps())
        logger.info("City %s created by %s", city.id, request.user.uid)
        return Response(CitySerializer(city).data, status=status.HTTP_201_CREATED)


class CityView(APIView):
    permission_classes = [CanManageCities]
    throttle_classes = SENSITIVE_THROTTLES

    def patch(self, request, city_id: str) -> Response:
        changes = validated_body(CityUpdateSerializer, request)
        city = update_city(city_id, changes, _deps())
        logger.info("City %s updated by %s", city.id, request.user.uid)
        return Response(CitySerializer(city).data)

    def delete(self, request, city_id: str) -> Response:
        delete_city(city_id, _deps())
        logger.info("City %s deleted by %s", city_id, request.user.uid)
        return Response(status=status.HTTP_204_NO_CONTENT)
