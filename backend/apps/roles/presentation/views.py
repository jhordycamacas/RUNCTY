import logging

from rest_framework import status
from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.roles.application.use_cases import (
    RolesDeps,
    create_role,
    delete_role,
    list_roles,
    set_user_role,
    update_role,
)
from apps.roles.presentation.serializers import (
    RoleCreateSerializer,
    RoleSerializer,
    RoleUpdateSerializer,
    UserRoleSerializer,
)
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.permissions import HasPermission
from apps.shared.presentation.throttles import SENSITIVE_THROTTLES

logger = logging.getLogger(__name__)

CanEnterPanel = HasPermission("admin.access")
# First gate, on the token. The use cases check it again on the claims stored in Auth.
CanManageRoles = HasPermission("roles.manage")


def _deps() -> RolesDeps:
    return RolesDeps(
        roles=adapter("ROLE_REPOSITORY"),
        members=adapter("ROLE_MEMBERS"),
        auth=adapter("AUTH_GATEWAY"),
    )


def _body(serializer_class, request) -> dict:
    serializer = serializer_class(data=request.data)
    serializer.is_valid(raise_exception=True)
    return serializer.validated_data


class RolesView(APIView):
    throttle_classes = SENSITIVE_THROTTLES

    def get_permissions(self):
        return [CanEnterPanel() if self.request.method in SAFE_METHODS else CanManageRoles()]

    def get(self, request) -> Response:
        roles = list_roles(adapter("ROLE_REPOSITORY"))
        return Response({"roles": RoleSerializer(roles, many=True).data})

    def post(self, request) -> Response:
        role = create_role(_body(RoleCreateSerializer, request), request.user.uid, _deps())
        logger.info("Role %s created by %s", role.id, request.user.uid)
        return Response(RoleSerializer(role).data, status=status.HTTP_201_CREATED)


class RoleView(APIView):
    permission_classes = [CanManageRoles]
    throttle_classes = SENSITIVE_THROTTLES

    def put(self, request, role_id: str) -> Response:
        body = {**_body(RoleUpdateSerializer, request), "id": role_id}
        synced = update_role(body, request.user.uid, _deps())
        logger.info("Role %s updated by %s (%d users synced)", role_id, request.user.uid, synced)
        return Response({"syncedUsers": synced})

    def delete(self, request, role_id: str) -> Response:
        delete_role(role_id, request.user.uid, _deps())
        logger.info("Role %s deleted by %s", role_id, request.user.uid)
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserRoleView(APIView):
    permission_classes = [CanManageRoles]
    throttle_classes = SENSITIVE_THROTTLES

    def put(self, request, uid: str) -> Response:
        body = _body(UserRoleSerializer, request)
        role = set_user_role(uid, body["roleId"], request.user.uid, _deps())
        logger.info("Role of %s set to %s by %s", uid, role.id, request.user.uid)
        return Response({"uid": uid, "role": role.id})
