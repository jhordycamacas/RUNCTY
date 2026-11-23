from apps.shared.presentation.serializers import StrictSerializer, raw_field
from apps.system_settings.domain.models import SystemSettings


class SettingsBodySerializer(StrictSerializer):
    """Body of `PUT /settings`: any subset of the parameters. The domain checks the values."""

    def get_fields(self):
        return {key: raw_field() for key in SystemSettings.defaults().to_document()}
