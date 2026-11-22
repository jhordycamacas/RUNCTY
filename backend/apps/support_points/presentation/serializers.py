from rest_framework import serializers

from apps.shared.presentation.serializers import StrictSerializer, raw_field, text_field


class SupportPointBodySerializer(StrictSerializer):
    """Body of `POST /support-points` and `PUT /support-points/{id}`."""

    type = raw_field()
    name = raw_field()
    location = raw_field()
    cityId = raw_field()
    openingHours = raw_field()


class SupportPointQuerySerializer(StrictSerializer):
    cityId = text_field(required=False)
    routeId = text_field(required=False)
    lat = serializers.FloatField(required=False)
    lng = serializers.FloatField(required=False)
    radiusM = serializers.FloatField(required=False)


class GuardedTrailBodySerializer(StrictSerializer):
    """Body of `POST /guarded-trails` and `PUT /guarded-trails/{id}`."""

    routeId = raw_field()
    segmentId = raw_field()
    days = raw_field()
    startTime = raw_field()
    endTime = raw_field()


class GuardedTrailQuerySerializer(StrictSerializer):
    routeId = text_field(required=False)


class SupportPointSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.CharField()
    name = serializers.CharField(allow_null=True)
    location = serializers.SerializerMethodField()
    cityId = serializers.CharField(source="city_id")
    openingHours = serializers.CharField(source="opening_hours", allow_null=True)

    def get_location(self, point) -> dict:
        return point.location.to_document()


class GuardedTrailSerializer(serializers.Serializer):
    id = serializers.CharField()
    routeId = serializers.CharField(source="route_id")
    segmentId = serializers.CharField(source="segment_id", allow_null=True)
    days = serializers.ListField(child=serializers.CharField())
    startTime = serializers.CharField(source="start_time")
    endTime = serializers.CharField(source="end_time")
