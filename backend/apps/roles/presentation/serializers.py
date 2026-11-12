from rest_framework import serializers

from apps.shared.presentation.serializers import MAX_ITEMS, MAX_TEXT, StrictSerializer


def _text(**options) -> serializers.CharField:
    # Untrimmed and possibly blank: `Rol.parse` normalizes and validates the value.
    return serializers.CharField(
        allow_blank=True, trim_whitespace=False, max_length=MAX_TEXT, **options
    )


class RoleUpdateSerializer(StrictSerializer):
    name = _text()
    description = _text(required=False)
    permissions = serializers.ListField(child=_text(), max_length=MAX_ITEMS)


class RoleCreateSerializer(RoleUpdateSerializer):
    id = _text()


class UserRoleSerializer(StrictSerializer):
    roleId = _text()


class RoleSerializer(serializers.Serializer):
    """A `Rol` as the clients read it."""

    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    permissions = serializers.ListField(child=serializers.CharField())
    system = serializers.BooleanField()
