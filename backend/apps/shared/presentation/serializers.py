from collections.abc import Mapping

from rest_framework import serializers
from rest_framework.exceptions import ErrorDetail, ValidationError

# Upper bounds that keep request bodies small. They are not business rules: the domain
# applies the real limits and owns their reason codes.
MAX_TEXT = 500
MAX_ITEMS = 50


class StrictSerializer(serializers.Serializer):
    """Request body: a JSON object holding only the declared fields.

    Serializers check the shape (types and bounds); the domain validates the values.
    """

    def to_internal_value(self, data):
        unknown = (
            {
                name: [ErrorDetail("Unknown field.", code="unknown")]
                for name in data
                if name not in self.fields
            }
            if isinstance(data, Mapping)
            else {}
        )
        try:
            value = super().to_internal_value(data)
        except ValidationError as error:
            raise ValidationError({**error.detail, **unknown}) from error
        if unknown:
            raise ValidationError(unknown)
        return value
