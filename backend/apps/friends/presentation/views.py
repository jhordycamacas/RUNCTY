"""Friendships: any signed-in account, always on its own uid (`request.user.uid`)."""

import logging

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.friends.application import use_cases
from apps.friends.application.use_cases import FriendsDeps
from apps.friends.presentation.serializers import (
    FriendSerializer,
    RequestViewSerializer,
    SearchHitSerializer,
    SearchQuerySerializer,
    SendRequestBodySerializer,
)
from apps.routes.domain.time import local_now
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.serializers import validated_body, validated_query
from apps.shared.presentation.throttles import SENSITIVE_THROTTLES, SensitiveWritesMixin
from apps.system_settings.presentation.current import current_settings

logger = logging.getLogger(__name__)


def _deps() -> FriendsDeps:
    return FriendsDeps(
        requests=adapter("FRIEND_REQUEST_REPOSITORY"),
        friendships=adapter("FRIENDSHIP_REPOSITORY"),
        users=adapter("USER_REPOSITORY"),
    )


class FriendsView(APIView):
    def get(self, request) -> Response:
        friends = use_cases.list_friends(request.user.uid, _deps())
        return Response({"friends": FriendSerializer(friends, many=True).data})


class FriendView(SensitiveWritesMixin, APIView):
    def delete(self, request, uid: str) -> Response:
        use_cases.remove_friend(uid, request.user.uid, adapter("FRIENDSHIP_REPOSITORY"))
        logger.info("Friendship between %s and %s removed", request.user.uid, uid)
        return Response(status=status.HTTP_204_NO_CONTENT)


class FriendRequestsView(SensitiveWritesMixin, APIView):
    def get(self, request) -> Response:
        pending = use_cases.list_pending_requests(request.user.uid, _deps())
        return Response(
            {
                "incoming": RequestViewSerializer(pending.incoming, many=True).data,
                "outgoing": RequestViewSerializer(pending.outgoing, many=True).data,
            }
        )

    def post(self, request) -> Response:
        deps = _deps()
        body = validated_body(SendRequestBodySerializer, request)
        now = local_now(current_settings())
        sent = use_cases.send_request(body, request.user.uid, now, deps)
        logger.info("Friend request %s sent by %s", sent.id, request.user.uid)
        return Response({"id": sent.id}, status=status.HTTP_201_CREATED)


class FriendRequestView(SensitiveWritesMixin, APIView):
    def delete(self, request, request_id: str) -> Response:
        use_cases.cancel_request(request_id, request.user.uid, adapter("FRIEND_REQUEST_REPOSITORY"))
        return Response(status=status.HTTP_204_NO_CONTENT)


class FriendRequestAcceptView(SensitiveWritesMixin, APIView):
    def post(self, request, request_id: str) -> Response:
        now = local_now(current_settings())
        use_cases.accept_request(request_id, request.user.uid, now, _deps())
        logger.info("Friend request %s accepted by %s", request_id, request.user.uid)
        return Response(status=status.HTTP_204_NO_CONTENT)


class FriendRequestRejectView(SensitiveWritesMixin, APIView):
    def post(self, request, request_id: str) -> Response:
        now = local_now(current_settings())
        use_cases.reject_request(
            request_id, request.user.uid, now, adapter("FRIEND_REQUEST_REPOSITORY")
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class FriendSearchView(APIView):
    def get_throttles(self):
        # The search exposes the names of other accounts.
        return [throttle() for throttle in SENSITIVE_THROTTLES]

    def get(self, request) -> Response:
        query = validated_query(SearchQuerySerializer, request)
        hits = use_cases.search_people(query.get("q"), request.user.uid, _deps())
        return Response({"results": SearchHitSerializer(hits, many=True).data})
