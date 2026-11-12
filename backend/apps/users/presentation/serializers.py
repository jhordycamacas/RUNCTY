from rest_framework import serializers

from apps.shared.presentation.serializers import MAX_ITEMS, StrictSerializer, text_field


class PersonalDataSerializer(StrictSerializer):
    """Body of `PATCH /users/me`: any subset of the editable personal data."""

    firstName = text_field(required=False)
    lastName = text_field(required=False)
    birthDate = text_field(required=False)
    cityId = text_field(required=False)
    idNumber = text_field(required=False, allow_null=True)


class ConsentSerializer(StrictSerializer):
    lopdp = serializers.BooleanField()


class RegistrationSerializer(PersonalDataSerializer):
    """Body of `POST /users`. `Usuario.register` says which personal data is required."""

    consent = ConsentSerializer()


class UserSerializer(serializers.Serializer):
    """A `Usuario` as its owner reads it."""

    uid = serializers.CharField()
    email = serializers.CharField()
    firstName = serializers.CharField(source="first_name")
    lastName = serializers.CharField(source="last_name")
    birthDate = serializers.CharField(source="birth_date")
    cityId = serializers.CharField(source="city_id")
    idNumber = serializers.CharField(source="id_number", allow_null=True)
    role = serializers.CharField(allow_null=True)


class SportProfileSerializer(StrictSerializer):
    level = text_field()
    goals = serializers.ListField(child=text_field(), max_length=MAX_ITEMS)
    usualPaceSecPerKm = serializers.FloatField()
    preferredDistanceKm = serializers.FloatField()


class NotificationsSerializer(StrictSerializer):
    enabled = serializers.BooleanField()
    safetyAlerts = serializers.BooleanField()
    events = serializers.BooleanField()


class PreferencesSerializer(StrictSerializer):
    language = text_field()
    fontScale = text_field()
    appearance = text_field()
    units = text_field()
    notifications = NotificationsSerializer()
    locationPrivacy = text_field()
