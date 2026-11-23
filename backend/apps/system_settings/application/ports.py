from typing import Protocol

from apps.system_settings.domain.models import SystemSettings


class SettingsRepository(Protocol):
    """The single `systemSettings/global` document."""

    def get(self) -> SystemSettings | None:
        """The stored settings, with defaults for any missing field; None if never saved."""
        ...

    def save(self, settings: SystemSettings) -> None: ...
