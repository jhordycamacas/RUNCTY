from rest_framework import serializers

from apps.routes.presentation.serializers import RouteSerializer
from apps.safe_routes.application.use_cases import RecommendationResult
from apps.shared.presentation.serializers import StrictSerializer, raw_field


class RequestBodySerializer(StrictSerializer):
    """Body of `POST /safe-route-requests`."""

    cityId = raw_field()
    distanceKm = raw_field()
    startTime = raw_field()
    endTime = raw_field()


class RequestSerializer(serializers.Serializer):
    id = serializers.CharField()
    cityId = serializers.CharField(source="city_id")
    distanceKm = serializers.ReadOnlyField(source="distance_km")
    startTime = serializers.CharField(source="start_time")
    endTime = serializers.CharField(source="end_time")
    createdAt = serializers.CharField(source="created_at")


class SlotSafetySerializer(serializers.Serializer):
    slotId = serializers.CharField(source="slot_id")
    level = serializers.CharField()
    score = serializers.IntegerField()
    startTime = serializers.CharField(source="start_time")
    endTime = serializers.CharField(source="end_time")
    factors = serializers.ReadOnlyField()


class RecommendedRouteSerializer(serializers.Serializer):
    route = RouteSerializer()
    # null: the route has no index for the requested window.
    safety = SlotSafetySerializer(allow_null=True)


def recommended_routes_data(result: RecommendationResult) -> list:
    return RecommendedRouteSerializer(result.routes, many=True).data
