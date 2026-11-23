from rest_framework import serializers

from apps.shared.presentation.serializers import StrictSerializer, raw_field, text_field


class SourceBodySerializer(StrictSerializer):
    """Body of `POST /information-sources` and `PUT /information-sources/{id}`."""

    entity = raw_field()
    dataType = raw_field()
    data = raw_field()


class IncidentBodySerializer(StrictSerializer):
    """Body of `POST /safety-incidents` and `PUT /safety-incidents/{id}`."""

    routeId = raw_field()
    segmentId = raw_field()
    type = raw_field()
    severity = raw_field()
    date = raw_field()
    time = raw_field()
    sourceId = raw_field()


# Built with `type` because `from` is a Python keyword.
IncidentQuerySerializer = type(
    "IncidentQuerySerializer",
    (StrictSerializer,),
    {name: text_field(required=False) for name in ("routeId", "segmentId", "type", "from", "to")},
)


class SourceSerializer(serializers.Serializer):
    id = serializers.CharField()
    entity = serializers.CharField()
    dataType = serializers.CharField(source="data_type")
    loadedAt = serializers.CharField(source="loaded_at")
    data = serializers.CharField(allow_null=True)


class IncidentSerializer(serializers.Serializer):
    id = serializers.CharField()
    routeId = serializers.CharField(source="route_id")
    segmentId = serializers.CharField(source="segment_id", allow_null=True)
    type = serializers.CharField()
    severity = serializers.CharField()
    date = serializers.CharField()
    time = serializers.CharField()
    sourceId = serializers.CharField(source="source_id")
    sourceDeleted = serializers.BooleanField(source="source_deleted")
