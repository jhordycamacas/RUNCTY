from rest_framework import serializers

from apps.shared.presentation.serializers import StrictSerializer, raw_field


class CatalogBodySerializer(StrictSerializer):
    """Body of `PUT /catalogs/<id>`. The domain checks the items."""

    items = raw_field()


class CatalogQuerySerializer(StrictSerializer):
    """Query string of `GET /catalogs/<id>`: `active=true` keeps only the active items."""

    active = serializers.ChoiceField(["true", "false"], required=False)
