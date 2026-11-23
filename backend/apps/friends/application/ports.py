from typing import Protocol

from apps.friends.domain.models import FriendRequest, Friendship


class FriendRequestRepository(Protocol):
    """The `friendRequests` collection."""

    def new_id(self) -> str: ...

    def get(self, request_id: str) -> FriendRequest | None: ...

    def save(self, request: FriendRequest) -> None: ...

    def delete(self, request_id: str) -> None: ...

    def sent_by(self, uid: str) -> list[FriendRequest]:
        """Every request `uid` sent, whatever its status."""
        ...

    def received_by(self, uid: str) -> list[FriendRequest]:
        """Every request addressed to `uid`, whatever its status."""
        ...


class FriendshipRepository(Protocol):
    """The `users/{uid}/friends` sub-collections: a friendship is stored on both sides."""

    def list(self, uid: str) -> list[Friendship]: ...

    def exists(self, uid: str, friend_uid: str) -> bool: ...

    def add(self, uid: str, friend_uid: str, since: str) -> None:
        """Writes both sides together. Idempotent."""
        ...

    def remove(self, uid: str, friend_uid: str) -> None:
        """Deletes both sides together. Idempotent."""
        ...

    def remove_all(self, uid: str) -> None:
        """Deletes every friendship of `uid`, on its side and on each friend's."""
        ...
