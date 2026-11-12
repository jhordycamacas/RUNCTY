from rest_framework.response import Response
from rest_framework.views import APIView


class MeView(APIView):
    """The caller as the API sees it: identity and authority from the verified ID token."""

    def get(self, request) -> Response:
        principal = request.user
        return Response(
            {
                "uid": principal.uid,
                "email": principal.email,
                "emailVerified": principal.email_verified,
                "role": principal.role,
                "perms": principal.perms,
            }
        )
