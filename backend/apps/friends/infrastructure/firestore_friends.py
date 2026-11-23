from google.cloud.firestore import DocumentReference

from apps.friends.application.use_cases import erase_user
from apps.friends.domain.models import FriendRequest, Friendship
from apps.shared.infrastructure.firebase.app import firestore_client
from apps.shared.infrastructure.firebase.collections import FRIEND_REQUESTS, FRIENDS, USERS
from apps.shared.infrastructure.firebase.documents import DocumentStore, FirestoreDocumentStore

# A Firestore batch holds 500 writes and each friend takes two of them.
_FRIENDS_PER_BATCH = 200


class FirestoreFriendRequestRepository:
    """`FriendRequestRepository` adapter over `friendRequests`."""

    def __init__(self, store: DocumentStore | None = None) -> None:
        self._store = store or FirestoreDocumentStore(FRIEND_REQUESTS)

    def new_id(self) -> str:
        return self._store.new_id()

    def get(self, request_id: str) -> FriendRequest | None:
        data = self._store.get(request_id)
        return None if data is None else FriendRequest.from_document(request_id, data)

    def save(self, request: FriendRequest) -> None:
        self._store.set(request.id, request.to_document())

    def delete(self, request_id: str) -> None:
        self._store.delete(request_id)

    def sent_by(self, uid: str) -> list[FriendRequest]:
        return [
            FriendRequest.from_document(i, data) for i, data in self._store.where("fromUid", uid)
        ]

    def received_by(self, uid: str) -> list[FriendRequest]:
        return [FriendRequest.from_document(i, data) for i, data in self._store.where("toUid", uid)]


def _side(uid: str, friend_uid: str) -> DocumentReference:
    return (
        firestore_client().collection(USERS).document(uid).collection(FRIENDS).document(friend_uid)
    )


class FirestoreFriendshipRepository:
    """`FriendshipRepository` adapter over `users/{uid}/friends`; both sides in one batch."""

    def list(self, uid: str) -> list[Friendship]:
        friends = firestore_client().collection(USERS).document(uid).collection(FRIENDS)
        return [Friendship.from_document(found.id, found.to_dict()) for found in friends.stream()]

    def exists(self, uid: str, friend_uid: str) -> bool:
        return _side(uid, friend_uid).get().exists

    def add(self, uid: str, friend_uid: str, since: str) -> None:
        batch = firestore_client().batch()
        batch.set(_side(uid, friend_uid), Friendship(friend_uid, since).to_document())
        batch.set(_side(friend_uid, uid), Friendship(uid, since).to_document())
        batch.commit()

    def remove(self, uid: str, friend_uid: str) -> None:
        batch = firestore_client().batch()
        batch.delete(_side(uid, friend_uid))
        batch.delete(_side(friend_uid, uid))
        batch.commit()

    def remove_all(self, uid: str) -> None:
        # `list_documents` also finds documents without fields; Firestore never deletes a
        # sub-collection with its parent.
        friend_uids = [
            ref.id
            for ref in firestore_client()
            .collection(USERS)
            .document(uid)
            .collection(FRIENDS)
            .list_documents()
        ]
        for start in range(0, len(friend_uids), _FRIENDS_PER_BATCH):
            batch = firestore_client().batch()
            for friend_uid in friend_uids[start : start + _FRIENDS_PER_BATCH]:
                batch.delete(_side(uid, friend_uid))
                batch.delete(_side(friend_uid, uid))
            batch.commit()


class FirestoreFriendsEraser:
    """Deletes the friend data of an account when it is deleted (`UserFriendsEraser`)."""

    def __init__(
        self,
        requests: FirestoreFriendRequestRepository | None = None,
        friendships: FirestoreFriendshipRepository | None = None,
    ) -> None:
        self._requests = requests or FirestoreFriendRequestRepository()
        self._friendships = friendships or FirestoreFriendshipRepository()

    def erase(self, uid: str) -> None:
        erase_user(uid, self._requests, self._friendships)
