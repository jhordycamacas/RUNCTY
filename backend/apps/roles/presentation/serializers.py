from rest_framework import serializers

from apps.shared.presentation.serializers import MAX_ITEMS, StrictSerializer, text_field


class RoleUpdateSerializer(StrictSerializer):
    name = text_field()
    description = text_field(required=False)
    permissions = serializers.ListField(child=text_field(), max_length=MAX_ITEMS)


class RoleCreateSerializer(RoleUpdateSerializer):
    id = text_field()


class UserRoleSerializer(StrictSerializer):
    roleId = text_field()


class RoleSerializer(serializers.Serializer):
    """A `Rol` as the clients read it."""

    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    permissions = serializers.ListField(child=serializers.CharField())
    system = serializers.BooleanField()
