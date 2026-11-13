from collections.abc import Mapping
from typing import Protocol


class SeedAccounts(Protocol):
    """The admin account of the emulator: a Firebase Auth user and its `users/{uid}` document."""

    def ensure_admin_account(self, email: str, password: str, display_name: str) -> str:
        """The uid of the account with `email`; created, verified, when it does not exist."""
        ...

    def save_admin_profile(self, uid: str, profile: Mapping[str, object]) -> None:
        """Merges `profile` into `users/{uid}`; the creation timestamp is set only once."""
        ...
