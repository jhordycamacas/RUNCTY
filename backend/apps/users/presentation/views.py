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
    clear_user_sport_profile,
    delete_account,
    delete_user_account,
    get_preferences,
    get_profile,
    get_profile_photo,
    get_sport_profile,
    get_user_detail,
    register_user,
    save_preferences,
    save_profile_photo,
    save_sport_profile,
    save_user_sport_profile,
    search_users,
    update_personal_data,
    update_user_personal_data,
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
CanManageUsers = HasPermission("users.manage")


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


class UserDetailView(APIView):
    """The admin reads (`users.read`), edits or deletes (`users.manage`) one account.

    The rating comes with the group runs (RF-01-2). The email is the login, so it is never
    editable here.
    """

    def get_permissions(self):
        return [CanReadUsers() if self.request.method == "GET" else CanManageUsers()]

    def get_throttles(self):
        return [throttle() for throttle in SENSITIVE_THROTTLES]

    def get(self, request, uid: str) -> Response:
        detail = get_user_detail(
            uid, adapter("USER_REPOSITORY"), adapter("SPORT_PROFILE_REPOSITORY")
        )
        sport_profile = detail.sport_profile
        return Response(
            {
                "user": UserSerializer(detail.user).data,
                "sportProfile": sport_profile.to_document() if sport_profile else None,
                "rating": None,  # {"average", "count"} once the group runs can be rated
            }
        )

    def patch(self, request, uid: str) -> Response:
        user = update_user_personal_data(
            uid,
            validated_body(PersonalDataSerializer, request),
            date.today(),
            adapter("USER_REPOSITORY"),
        )
        return Response({"user": UserSerializer(user).data})

    def delete(self, request, uid: str) -> Response:
        delete_user_account(
            request.user,
            uid,
            adapter("USER_REPOSITORY"),
            adapter("AUTH_GATEWAY"),
            adapter("FRIENDS_ERASER"),
        )
        logger.info("Account %s deleted by %s", uid, request.user.uid)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserSportProfileView(APIView):
    """The admin sets or clears the sport profile of one account (`users.manage`)."""

    permission_classes = [CanManageUsers]

    def get_throttles(self):
        return [throttle() for throttle in SENSITIVE_THROTTLES]

    def put(self, request, uid: str) -> Response:
        profile = save_user_sport_profile(
            uid,
            validated_body(SportProfileSerializer, request),
            adapter("USER_REPOSITORY"),
            adapter("SPORT_PROFILE_REPOSITORY"),
            adapter("CATALOG_REPOSITORY"),
            current_settings(),
        )
        return Response({"sportProfile": profile.to_document()})

    def delete(self, request, uid: str) -> Response:
        clear_user_sport_profile(
            uid, adapter("USER_REPOSITORY"), adapter("SPORT_PROFILE_REPOSITORY")
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


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
            request.user,
            time.time(),
            adapter("USER_REPOSITORY"),
            adapter("AUTH_GATEWAY"),
            adapter("FRIENDS_ERASER"),
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
