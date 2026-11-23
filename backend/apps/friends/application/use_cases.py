"""Friendships: any signed-in account sends, answers and cancels requests and lists its friends.

Every use case acts on the uid of the verified token. A friend is only ever shown as a
`PublicProfile`.
"""

from dataclasses import dataclass
from datetime import datetime

from apps.friends.application.ports import FriendRequestRepository, FriendshipRepository
from apps.friends.domain.models import (
    ACCEPTED,
    MAX_SEARCH_RESULTS,
    PENDING,
    REJECTED,
    FriendRequest,
    PublicProfile,
    name_matches,
    parse_search_text,
    parse_uid,
)
from apps.routes.domain.models import parse_doc_id
from apps.shared.domain.errors import DomainError, ErrorKind
from apps.users.application.ports import UserRepository
from apps.users.domain.search import DEFAULT_SCAN_BUDGET, ScanBudget

NO_RELATION = "none"
FRIEND = "friend"
REQUEST_SENT = "request-sent"
REQUEST_RECEIVED = "request-received"


@dataclass(frozen=True, slots=True)
class FriendsDeps:
    requests: FriendRequestRepository
    friendships: FriendshipRepository
    users: UserRepository


@dataclass(frozen=True, slots=True)
class FriendView:
    profile: PublicProfile
    since: str


@dataclass(frozen=True, slots=True)
class RequestView:
    """A pending request with the limited profile of the other account."""

    request: FriendRequest
    profile: PublicProfile


@dataclass(frozen=True, slots=True)
class PendingRequests:
    incoming: list[RequestView]
    outgoing: list[RequestView]


@dataclass(frozen=True, slots=True)
class SearchHit:
    profile: PublicProfile
    relation: str


def _error(kind: ErrorKind, reason: str, message: str) -> DomainError:
    return DomainError(kind, reason, message)


def _request_not_found(request_id: str) -> DomainError:
    return _error(
        ErrorKind.NOT_FOUND, "request-not-found", f'Friend request "{request_id}" does not exist.'
    )


def _pending(requests: list[FriendRequest]) -> list[FriendRequest]:
    return [request for request in requests if request.status == PENDING]


def _newest_first(requests: list[FriendRequest]) -> list[FriendRequest]:
    return sorted(requests, key=lambda r: (r.created_at, r.id), reverse=True)


def _pending_request(raw_id: object, requests: FriendRequestRepository) -> FriendRequest:
    request_id = parse_doc_id(raw_id, "invalid-request-id")
    request = requests.get(request_id)
    if request is None or request.status != PENDING:
        raise _request_not_found(request_id)
    return request


def send_request(raw: object, uid: str, now: datetime, deps: FriendsDeps) -> FriendRequest:
    request = FriendRequest.create(raw, deps.requests.new_id(), uid, now)
    if deps.users.get(request.to_uid) is None:
        raise _error(ErrorKind.NOT_FOUND, "user-not-found", "The user does not exist.")
    if deps.friendships.exists(uid, request.to_uid):
        raise _error(ErrorKind.CONFLICT, "already-friends", "You are already friends.")
    # A pending request in either direction: the other side answers it instead of a new one.
    sent = _pending(deps.requests.sent_by(uid))
    received = _pending(deps.requests.received_by(uid))
    if any(r.to_uid == request.to_uid for r in sent) or any(
        r.from_uid == request.to_uid for r in received
    ):
        raise _error(ErrorKind.CONFLICT, "request-pending", "A friend request is already pending.")
    deps.requests.save(request)
    return request


def accept_request(raw_id: object, uid: str, now: datetime, deps: FriendsDeps) -> None:
    request = _pending_request(raw_id, deps.requests)
    _require_recipient(request, uid)
    # The friendship first: a retry after a failure in between completes the same acceptance.
    deps.friendships.add(request.from_uid, request.to_uid, now.isoformat(timespec="seconds"))
    deps.requests.save(request.respond(ACCEPTED, now))


def reject_request(
    raw_id: object, uid: str, now: datetime, requests: FriendRequestRepository
) -> None:
    request = _pending_request(raw_id, requests)
    _require_recipient(request, uid)
    requests.save(request.respond(REJECTED, now))


def cancel_request(raw_id: object, uid: str, requests: FriendRequestRepository) -> None:
    request = _pending_request(raw_id, requests)
    if request.from_uid != uid:
        raise _error(
            ErrorKind.PERMISSION_DENIED,
            "not-request-sender",
            "Only the sender can cancel a friend request.",
        )
    requests.delete(request.id)


def _require_recipient(request: FriendRequest, uid: str) -> None:
    if request.to_uid != uid:
        raise _error(
            ErrorKind.PERMISSION_DENIED,
            "not-request-recipient",
            "Only the recipient can answer a friend request.",
        )


def list_friends(uid: str, deps: FriendsDeps) -> list[FriendView]:
    """The caller's friends, by name; an account that no longer exists is skipped."""
    views = []
    for friendship in deps.friendships.list(uid):
        user = deps.users.get(friendship.friend_uid)
        if user is not None:
            views.append(FriendView(PublicProfile.of(user), friendship.since))
    return sorted(
        views, key=lambda v: (v.profile.first_name.casefold(), v.profile.last_name.casefold())
    )


def remove_friend(raw_uid: object, uid: str, friendships: FriendshipRepository) -> None:
    """Idempotent: removing someone who is not a friend does nothing."""
    friendships.remove(uid, parse_uid(raw_uid, "invalid-uid"))


def _with_profiles(
    requests: list[FriendRequest], other_uid: str, users: UserRepository
) -> list[RequestView]:
    views = []
    for request in _newest_first(requests):
        user = users.get(getattr(request, other_uid))
        if user is not None:
            views.append(RequestView(request, PublicProfile.of(user)))
    return views


def list_pending_requests(uid: str, deps: FriendsDeps) -> PendingRequests:
    return PendingRequests(
        incoming=_with_profiles(_pending(deps.requests.received_by(uid)), "from_uid", deps.users),
        outgoing=_with_profiles(_pending(deps.requests.sent_by(uid)), "to_uid", deps.users),
    )


def search_people(
    raw_text: object, uid: str, deps: FriendsDeps, budget: ScanBudget = DEFAULT_SCAN_BUDGET
) -> list[SearchHit]:
    """Accounts whose name starts with the text, with their relation to the caller.

    The scan is bounded like the admin search; the caller never appears in it.
    """
    text = parse_search_text(raw_text)
    friends = {friendship.friend_uid for friendship in deps.friendships.list(uid)}
    sent = {r.to_uid for r in _pending(deps.requests.sent_by(uid))}
    received = {r.from_uid for r in _pending(deps.requests.received_by(uid))}

    def relation(other: str) -> str:
        if other in friends:
            return FRIEND
        if other in sent:
            return REQUEST_SENT
        return REQUEST_RECEIVED if other in received else NO_RELATION

    hits: list[SearchHit] = []
    cursor: str | None = None
    scanned = 0
    while scanned < budget.max_scanned:
        batch_size = min(budget.batch_size, budget.max_scanned - scanned)
        batch = deps.users.scan([], cursor, batch_size)
        for user in batch:
            cursor = user.uid
            scanned += 1
            if user.uid != uid and name_matches(user, text):
                hits.append(SearchHit(PublicProfile.of(user), relation(user.uid)))
                if len(hits) == MAX_SEARCH_RESULTS:
                    return hits
        if len(batch) < batch_size:
            break
    return hits


def erase_user(
    uid: str, requests: FriendRequestRepository, friendships: FriendshipRepository
) -> None:
    """Account deletion: the requests the account sent or received and all its friendships."""
    for request in [*requests.sent_by(uid), *requests.received_by(uid)]:
        requests.delete(request.id)
    friendships.remove_all(uid)
