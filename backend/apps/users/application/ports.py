from typing import Protocol

from apps.users.domain.models import PerfilDeportivo, PreferenciaUsuario, Usuario


class UserRepository(Protocol):
    def get(self, uid: str) -> Usuario | None: ...

    def create(self, user: Usuario) -> bool:
        """Stores a new profile with its consent record.

        Returns False, writing nothing, when the account already has a profile.
        """
        ...

    def update_personal_data(self, user: Usuario) -> None:
        """Writes the personal data of an existing profile; nothing else changes."""
        ...

    def set_role(self, uid: str, role: str) -> None:
        """Mirrors the role claim on the profile. A missing profile is ignored."""
        ...


class SportProfileRepository(Protocol):
    def get(self, uid: str) -> PerfilDeportivo | None: ...

    def save(self, uid: str, profile: PerfilDeportivo) -> None:
        """Creates or replaces the whole document."""
        ...

    def delete(self, uid: str) -> None: ...


class PreferencesRepository(Protocol):
    def get(self, uid: str) -> PreferenciaUsuario | None: ...

    def save(self, uid: str, preferences: PreferenciaUsuario) -> None:
        """Creates or replaces the whole document."""
        ...

    def delete(self, uid: str) -> None: ...
