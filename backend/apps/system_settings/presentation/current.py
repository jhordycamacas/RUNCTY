from apps.shared.presentation.adapters import adapter
from apps.system_settings.application.use_cases import get_settings
from apps.system_settings.domain.models import SystemSettings


def current_settings() -> SystemSettings:
    """The parameters in force, for the views that build the deps of a use case."""
    return get_settings(adapter("SETTINGS_REPOSITORY"))
