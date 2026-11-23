from rest_framework import serializers

from apps.shared.presentation.serializers import StrictSerializer, raw_field, text_field


class CityUpdateSerializer(StrictSerializer):
    """Body of `PATCH /cities/{id}`: any subset of the editable fields. The domain checks types."""

    name = raw_field()
    province = raw_field()
    location = raw_field()
    coverage = raw_field()
    parentCityId = raw_field()


class CityCreateSerializer(CityUpdateSerializer):
    id = raw_field()
    type = raw_field()


class CityQuerySerializer(StrictSerializer):
    coverage = text_field(required=False)


class CitySerializer(serializers.Serializer):
    """A `Ciudad` as the clients read it."""

    id = serializers.CharField()
    name = serializers.CharField()
    province = serializers.CharField()
    country = serializers.CharField()
    type = serializers.CharField()
    parentCityId = serializers.CharField(source="parent_city_id", allow_null=True)
    location = serializers.SerializerMethodField()
    coverage = serializers.CharField()

    def get_location(self, city) -> dict[str, float]:
        return {"lat": city.lat, "lng": city.lng}
