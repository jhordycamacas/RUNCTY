from typing import Protocol

from apps.users.domain.models import PerfilDeportivo, PreferenciaUsuario, Usuario
from apps.users.domain.profile_photo import ProfilePhoto
from apps.users.domain.search import EqualityFilter


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

    def scan(
        self, filters: list[EqualityFilter], start_after: str | None, batch_size: int
    ) -> list[Usuario]:
        """Up to `batch_size` profiles matching every filter, ordered by uid, after `start_after`.

        Only the fields of the admin summary are read; `id_number` is always None.
        """
        ...

    def delete_user_data(self, uid: str, *, keep_an_admin: bool) -> bool:
        """Deletes the profile of `uid` and its private documents, atomically with its check.

        With `keep_an_admin`, returns False, deleting nothing, unless the role mirror shows
        an admin other than `uid`.
        """
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


class ProfilePhotoRepository(Protocol):
    def get(self, uid: str) -> ProfilePhoto | None: ...

    def save(self, uid: str, photo: ProfilePhoto) -> None:
        """Creates or replaces the whole document."""
        ...

    def delete(self, uid: str) -> None: ...
