from rest_framework import serializers

from apps.routes.application.use_cases import RouteDetail
from apps.shared.presentation.serializers import StrictSerializer, raw_field, text_field


class RouteBodySerializer(StrictSerializer):
    """Body of `POST /routes` and `PUT /routes/{id}`. The domain checks types and values."""

    name = raw_field()
    cityId = raw_field()
    description = raw_field()
    start = raw_field()
    end = raw_field()
    distanceKm = raw_field()
    elevationGainM = raw_field()
    surface = raw_field()
    difficulty = raw_field()
    active = raw_field()


class RouteImageBodySerializer(StrictSerializer):
    """Body of `PUT /routes/{id}/image`: the full image and its thumbnail as data URLs."""

    image = raw_field()
    thumbnail = raw_field()


class SegmentBodySerializer(StrictSerializer):
    name = raw_field()
    coordinates = raw_field()
    # Target position (0-based); absent keeps the position, or appends a new segment.
    order = raw_field()


class TimeSlotBodySerializer(StrictSerializer):
    label = raw_field()
    startTime = raw_field()
    endTime = raw_field()
    validFrom = raw_field()
    validTo = raw_field()


class RiskFactorBodySerializer(StrictSerializer):
    type = raw_field()
    severity = raw_field()
    description = raw_field()
    startTime = raw_field()
    endTime = raw_field()


class RouteQuerySerializer(StrictSerializer):
    cityId = text_field(required=False)


class RouteSerializer(serializers.Serializer):
    """A `Ruta` as the clients read it. `safety` is the stored index per time slot id."""

    id = serializers.CharField()
    name = serializers.CharField()
    cityId = serializers.CharField(source="city_id")
    description = serializers.CharField()
    start = serializers.SerializerMethodField()
    end = serializers.SerializerMethodField()
    distanceKm = serializers.ReadOnlyField(source="distance_km")
    elevationGainM = serializers.ReadOnlyField(source="elevation_gain_m")
    surface = serializers.CharField()
    difficulty = serializers.CharField()
    active = serializers.BooleanField()
    segmentCount = serializers.ReadOnlyField(source="segment_count")
    safety = serializers.ReadOnlyField()
    imageThumb = serializers.CharField(source="image_thumb", allow_null=True)

    def get_start(self, route) -> dict:
        return route.start.to_document()

    def get_end(self, route) -> dict:
        return route.end.to_document()


class RouteListItemSerializer(RouteSerializer):
    """A route of `GET /routes`: the route plus `preview`, its shape down-sampled to at most 40
    `[lat, lng]` pairs. The detail carries the full segments instead."""

    preview = serializers.SerializerMethodField()

    def get_preview(self, route) -> list[list[float]]:
        return [[point.lat, point.lng] for point in route.preview]


class SegmentSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    order = serializers.ReadOnlyField()
    coordinates = serializers.SerializerMethodField()
    lengthM = serializers.ReadOnlyField(source="length_m")
    safety = serializers.ReadOnlyField()

    def get_coordinates(self, segment) -> list[dict]:
        return [point.to_document() for point in segment.coordinates]


class TimeSlotSerializer(serializers.Serializer):
    id = serializers.CharField()
    label = serializers.CharField(allow_null=True)
    startTime = serializers.CharField(source="start_time")
    endTime = serializers.CharField(source="end_time")
    validFrom = serializers.CharField(source="valid_from", allow_null=True)
    validTo = serializers.CharField(source="valid_to", allow_null=True)


class RiskFactorSerializer(serializers.Serializer):
    id = serializers.CharField()
    type = serializers.CharField()
    severity = serializers.CharField()
    description = serializers.CharField()
    startTime = serializers.CharField(source="start_time", allow_null=True)
    endTime = serializers.CharField(source="end_time", allow_null=True)


def route_detail_data(detail: RouteDetail) -> dict:
    """The route with its segments. Time slots and risk factors only when the detail holds them."""
    segments = []
    for segment in detail.segments:
        data = dict(SegmentSerializer(segment).data)
        if detail.factors is not None:
            factors = detail.factors.get(segment.id, [])
            data["riskFactors"] = RiskFactorSerializer(factors, many=True).data
        segments.append(data)
    data = {**RouteSerializer(detail.route).data, "segments": segments}
    if detail.slots is not None:
        data["timeSlots"] = TimeSlotSerializer(detail.slots, many=True).data
    return data
