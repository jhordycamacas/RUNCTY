from datetime import date

from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.serializers import validated_body
from apps.users.application.use_cases import (
    get_preferences,
    get_profile,
    get_sport_profile,
    register_user,
    save_preferences,
    save_sport_profile,
    update_personal_data,
)
from apps.users.presentation.serializers import (
    PersonalDataSerializer,
    PreferencesSerializer,
    RegistrationSerializer,
    SportProfileSerializer,
    UserSerializer,
)


class UsersView(APIView):
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


class OwnSportProfileView(APIView):
    def get(self, request) -> Response:
        profile = get_sport_profile(request.user.uid, adapter("SPORT_PROFILE_REPOSITORY"))
        return Response(profile.to_document())

    def put(self, request) -> Response:
        profile = save_sport_profile(
            request.user.uid,
            validated_body(SportProfileSerializer, request),
            adapter("SPORT_PROFILE_REPOSITORY"),
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
