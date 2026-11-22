from rest_framework import serializers

from apps.shared.presentation.serializers import StrictSerializer, raw_field, text_field


class AlertBodySerializer(StrictSerializer):
    """Body of `POST /risk-zone-alerts` and `PUT /risk-zone-alerts/{id}`."""

    type = raw_field()
    severity = raw_field()
    description = raw_field()
    location = raw_field()
    radiusM = raw_field()
    cityId = raw_field()
    routeId = raw_field()
    validFrom = raw_field()
    validTo = raw_field()
    startTime = raw_field()
    endTime = raw_field()


class AlertQuerySerializer(StrictSerializer):
    cityId = text_field(required=False)
    routeId = text_field(required=False)
    # `true` keeps only the alerts in force now (what the runner sees).
    active = serializers.BooleanField(required=False)


class AlertSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.CharField()
    severity = serializers.CharField()
    description = serializers.CharField()
    location = serializers.SerializerMethodField()
    radiusM = serializers.ReadOnlyField(source="radius_m")
    cityId = serializers.CharField(source="city_id")
    routeId = serializers.CharField(source="route_id", allow_null=True)
    validFrom = serializers.CharField(source="valid_from")
    validTo = serializers.CharField(source="valid_to")
    startTime = serializers.CharField(source="start_time", allow_null=True)
    endTime = serializers.CharField(source="end_time", allow_null=True)

    def get_location(self, alert) -> dict:
        return alert.location.to_document()
