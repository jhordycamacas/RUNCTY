from rest_framework import serializers

from apps.shared.presentation.serializers import StrictSerializer, raw_field, text_field


class SendRequestBodySerializer(StrictSerializer):
    """Body of `POST /friends/requests`. The domain validates the uid."""

    toUid = raw_field()


class SearchQuerySerializer(StrictSerializer):
    """Query string of `GET /friends/search`. The domain validates the text."""

    q = text_field(required=False)


class PublicProfileSerializer(serializers.Serializer):
    """The limited public profile: never the email, id number or birth date (LOPDP)."""

    uid = serializers.CharField()
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    cityId = serializers.CharField(source="city_id")


class FriendSerializer(serializers.Serializer):
    profile = PublicProfileSerializer()
    since = serializers.CharField()


class RequestViewSerializer(serializers.Serializer):
    id = serializers.CharField(source="request.id")
    createdAt = serializers.CharField(source="request.created_at")
    profile = PublicProfileSerializer()


class SearchHitSerializer(serializers.Serializer):
    profile = PublicProfileSerializer()
    relation = serializers.CharField()
