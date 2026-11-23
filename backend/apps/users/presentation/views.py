import logging
import time
from datetime import date

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.permissions import HasPermission, IsAuthenticated
from apps.shared.presentation.serializers import validated_body, validated_query
from apps.shared.presentation.throttles import SENSITIVE_THROTTLES
from apps.system_settings.presentation.current import current_settings
from apps.users.application.use_cases import (
    delete_account,
    get_preferences,
    get_profile,
    get_profile_photo,
    get_sport_profile,
    register_user,
    save_preferences,
    save_profile_photo,
    save_sport_profile,
    search_users,
    update_personal_data,
)
from apps.users.domain.search import parse_search_query
from apps.users.presentation.serializers import (
    PersonalDataSerializer,
    PreferencesSerializer,
    ProfilePhotoSerializer,
    RegistrationSerializer,
    SportProfileSerializer,
    UserSearchSerializer,
    UserSerializer,
    UserSummarySerializer,
)

logger = logging.getLogger(__name__)

CanReadUsers = HasPermission("users.read")


class UsersView(APIView):
    """`GET` is the admin search; `POST` is the sign-up of the caller's own profile."""

    def get_permissions(self):
        return [CanReadUsers() if self.request.method == "GET" else IsAuthenticated()]

    def get_throttles(self):
        if self.request.method != "GET":
            return super().get_throttles()
        # The search exposes personal data of other accounts.
        return [throttle() for throttle in SENSITIVE_THROTTLES]

    def get(self, request) -> Response:
        query = parse_search_query(validated_query(UserSearchSerializer, request))
        page = search_users(query, adapter("USER_REPOSITORY"))
        return Response(
            {
                "users": UserSummarySerializer(page.users, many=True).data,
                "nextCursor": page.next_cursor,
            }
        )

    def post(self, request) -> Response:
        user = register_user(
            request.user,
            validated_body(RegistrationSerializer, request),
            date.today(),
            adapter("USER_REPOSITORY"),
            adapter("AUTH_GATEWAY"),
        )
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class OwnProfileView(APIView):
    def get(self, request) -> Response:
        user = get_profile(request.user.uid, adapter("USER_REPOSITORY"))
        return Response(UserSerializer(user).data)

    def patch(self, request) -> Response:
        user = update_personal_data(
            request.user.uid,
            validated_body(PersonalDataSerializer, request),
            date.today(),
            adapter("USER_REPOSITORY"),
        )
        return Response(UserSerializer(user).data)

    def delete(self, request) -> Response:
        delete_account(
            request.user, time.time(), adapter("USER_REPOSITORY"), adapter("AUTH_GATEWAY")
        )
        logger.info("Account %s deleted", request.user.uid)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OwnSportProfileView(APIView):
    def get(self, request) -> Response:
        profile = get_sport_profile(request.user.uid, adapter("SPORT_PROFILE_REPOSITORY"))
        return Response(profile.to_document())

    def put(self, request) -> Response:
        profile = save_sport_profile(
            request.user.uid,
            validated_body(SportProfileSerializer, request),
            adapter("SPORT_PROFILE_REPOSITORY"),
            adapter("CATALOG_REPOSITORY"),
            current_settings(),
        )
        return Response(profile.to_document())

    def delete(self, request) -> Response:
        adapter("SPORT_PROFILE_REPOSITORY").delete(request.user.uid)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OwnPreferencesView(APIView):
    def get(self, request) -> Response:
        preferences = get_preferences(request.user.uid, adapter("PREFERENCES_REPOSITORY"))
        return Response(preferences.to_document())

    def put(self, request) -> Response:
        preferences = save_preferences(
            request.user.uid,
            validated_body(PreferencesSerializer, request),
            adapter("PREFERENCES_REPOSITORY"),
        )
        return Response(preferences.to_document())

    def delete(self, request) -> Response:
        # Deleting the document restores the defaults (RF-01-16).
        adapter("PREFERENCES_REPOSITORY").delete(request.user.uid)
        return Response(status=status.HTTP_204_NO_CONTENT)


class OwnPhotoView(APIView):
    """The caller's own photo only: no endpoint reads the photo of another account."""

    def get(self, request) -> Response:
        photo = get_profile_photo(request.user.uid, adapter("PROFILE_PHOTO_REPOSITORY"))
        return Response({"photo": photo.data if photo else None})

    def put(self, request) -> Response:
        photo = save_profile_photo(
            request.user.uid,
            validated_body(ProfilePhotoSerializer, request).get("photo"),
            adapter("PROFILE_PHOTO_REPOSITORY"),
            current_settings(),
        )
        return Response({"photo": photo.data})

    def delete(self, request) -> Response:
        adapter("PROFILE_PHOTO_REPOSITORY").delete(request.user.uid)
        return Response(status=status.HTTP_204_NO_CONTENT)
