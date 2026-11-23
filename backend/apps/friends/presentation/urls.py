from django.urls import path

from apps.friends.presentation.views import (
    FriendRequestAcceptView,
    FriendRequestRejectView,
    FriendRequestsView,
    FriendRequestView,
    FriendSearchView,
    FriendsView,
    FriendView,
)

urlpatterns = [
    path("friends", FriendsView.as_view()),
    path("friends/search", FriendSearchView.as_view()),
    path("friends/requests", FriendRequestsView.as_view()),
    path("friends/requests/<str:request_id>", FriendRequestView.as_view()),
    path("friends/requests/<str:request_id>/accept", FriendRequestAcceptView.as_view()),
    path("friends/requests/<str:request_id>/reject", FriendRequestRejectView.as_view()),
    path("friends/<str:uid>", FriendView.as_view()),
]
