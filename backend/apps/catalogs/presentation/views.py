import logging

from rest_framework.permissions import SAFE_METHODS
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.catalogs.application import use_cases
from apps.catalogs.domain.models import Catalog
from apps.catalogs.presentation.serializers import CatalogBodySerializer, CatalogQuerySerializer
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.permissions import HasPermission, IsAuthenticated
from apps.shared.presentation.serializers import validated_body, validated_query
from apps.shared.presentation.throttles import SensitiveWritesMixin

logger = logging.getLogger(__name__)

CanManageCatalogs = HasPermission("settings.manage")


def _body(catalog: Catalog) -> dict[str, object]:
    return {"id": catalog.id, **catalog.to_document()}


class CatalogView(SensitiveWritesMixin, APIView):
    """`GET`: every signed-in user reads the items (all of them, with their `active` flag, or
    only the active ones with `?active=true`); `PUT` replaces them and needs `settings.manage`."""

    def get_permissions(self):
        return [IsAuthenticated() if self.request.method in SAFE_METHODS else CanManageCatalogs()]

    def get(self, request, catalog_id: str) -> Response:
        query = validated_query(CatalogQuerySerializer, request)
        catalog = use_cases.get_catalog(catalog_id, adapter("CATALOG_REPOSITORY"))
        return Response(_body(catalog.active() if query.get("active") == "true" else catalog))

    def put(self, request, catalog_id: str) -> Response:
        body = validated_body(CatalogBodySerializer, request)
        catalog = use_cases.update_catalog(
            catalog_id, body.get("items"), adapter("CATALOG_REPOSITORY")
        )
        logger.info("Catalog %s updated by %s", catalog_id, request.user.uid)
        return Response(_body(catalog))
