"""Friendships between accounts: requests (`friendRequests/{id}`) and friends.

Privacy (LOPDP): a friend only ever sees the limited public profile of the other account
(`PublicProfile`): never the email, id number or birth date.
"""

from collections.abc import Mapping
from dataclasses import dataclass, replace
from datetime import datetime

from apps.routes.domain.models import as_mapping, stored_text
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.users.domain.models import Usuario
from apps.users.domain.search import normalize_name

PENDING = "pending"
ACCEPTED = "accepted"
REJECTED = "rejected"

MIN_SEARCH_CHARS = 3
MAX_SEARCH_CHARS = 120
MAX_SEARCH_RESULTS = 20
_MAX_UID = 128


def parse_uid(value: object, reason: str) -> str:
    """An account uid as the client sends it: text, no path separator, at most 128 chars."""
    if not isinstance(value, str) or not 0 < len(value) <= _MAX_UID or "/" in value:
        raise DomainError(ErrorKind.INVALID_ARGUMENT, reason, "A valid uid is required.")
    return value


@dataclass(frozen=True, slots=True)
class PublicProfile:
    """The limited view of an account that other users may see."""

    uid: str
    first_name: str
    last_name: str
    city_id: str

    @classmethod
    def of(cls, user: Usuario) -> "PublicProfile":
        return cls(user.uid, user.first_name, user.last_name, user.city_id)


@dataclass(frozen=True, slots=True)
class Friendship:
    """Document `users/{uid}/friends/{friendUid}`: one side of a friendship."""

    friend_uid: str
    # ISO 8601 moment with its offset, set by the server.
    since: str

    @classmethod
    def from_document(cls, friend_uid: str, data: Mapping[str, object]) -> "Friendship":
        return cls(friend_uid=friend_uid, since=stored_text(data.get("since")))

    def to_document(self) -> dict[str, object]:
        return {"friendUid": self.friend_uid, "since": self.since}


@dataclass(frozen=True, slots=True)
class FriendRequest:
    id: str
    from_uid: str
    to_uid: str
    status: str
    # ISO 8601 moments with their offset, set by the server.
    created_at: str
    responded_at: str | None = None

    @classmethod
    def create(cls, raw: object, request_id: str, from_uid: str, now: datetime) -> "FriendRequest":
        """A pending request from `from_uid` to the uid the client names."""
        to_uid = parse_uid(as_mapping(raw).get("toUid"), "invalid-uid")
        if to_uid == from_uid:
            raise DomainError(
                ErrorKind.INVALID_ARGUMENT,
                "cannot-friend-self",
                "You cannot send a friend request to yourself.",
            )
        return cls(
            id=request_id,
            from_uid=from_uid,
            to_uid=to_uid,
            status=PENDING,
            created_at=now.isoformat(timespec="seconds"),
        )

    def respond(self, status: str, now: datetime) -> "FriendRequest":
        return replace(self, status=status, responded_at=now.isoformat(timespec="seconds"))

    @classmethod
    def from_document(cls, request_id: str, data: Mapping[str, object]) -> "FriendRequest":
        responded_at = data.get("respondedAt")
        return cls(
            id=request_id,
            from_uid=stored_text(data.get("fromUid")),
            to_uid=stored_text(data.get("toUid")),
            status=stored_text(data.get("status"), PENDING),
            created_at=stored_text(data.get("createdAt")),
            responded_at=responded_at if isinstance(responded_at, str) else None,
        )

    def to_document(self) -> dict[str, object]:
        return {
            "fromUid": self.from_uid,
            "toUid": self.to_uid,
            "status": self.status,
            "createdAt": self.created_at,
            "respondedAt": self.responded_at,
        }


def parse_search_text(value: object) -> str:
    """The text of a friend search: at least 3 characters once trimmed."""
    text = value.strip() if isinstance(value, str) else ""
    if len(text) < MIN_SEARCH_CHARS or len(text) > MAX_SEARCH_CHARS:
        raise DomainError(
            ErrorKind.INVALID_ARGUMENT,
            "invalid-search",
            f"The search text must have {MIN_SEARCH_CHARS} to {MAX_SEARCH_CHARS} characters.",
        )
    return text


def name_matches(user: Usuario, text: str) -> bool:
    """Whether every word of `text` starts a word of the name (case and accent insensitive).

    Only the name is compared: an email or id number never finds an account here.
    """
    name_words = normalize_name(f"{user.first_name} {user.last_name}").split()
    return all(
        any(word.startswith(part) for word in name_words) for part in normalize_name(text).split()
    )
