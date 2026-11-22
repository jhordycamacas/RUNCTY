"""EP-08: read and written only with `routes.manage`; runners never see incidents."""

from rest_framework.response import Response
from rest_framework.views import APIView

from apps.routes.domain.time import local_now
from apps.routes.presentation.views import ManageOnly, changed, created
from apps.safety_data.application import use_cases
from apps.safety_data.application.use_cases import SafetyDataDeps
from apps.safety_data.presentation.serializers import (
    IncidentBodySerializer,
    IncidentQuerySerializer,
    IncidentSerializer,
    SourceBodySerializer,
    SourceSerializer,
)
from apps.shared.presentation.adapters import adapter
from apps.shared.presentation.serializers import validated_body, validated_query


def _deps() -> SafetyDataDeps:
    return SafetyDataDeps(
        sources=adapter("SOURCE_REPOSITORY"),
        incidents=adapter("INCIDENT_REPOSITORY"),
        routes=adapter("ROUTE_REPOSITORY"),
    )


class InformationSourcesView(ManageOnly, APIView):
    def get(self, request) -> Response:
        sources = use_cases.list_sources(adapter("SOURCE_REPOSITORY"))
        return Response({"sources": SourceSerializer(sources, many=True).data})

    def post(self, request) -> Response:
        body = validated_body(SourceBodySerializer, request)
        source_id = use_cases.create_source(body, local_now().date(), adapter("SOURCE_REPOSITORY"))
        return created(request, "Information source", source_id)


class InformationSourceView(ManageOnly, APIView):
    def get(self, request, source_id: str) -> Response:
        source = use_cases.get_source(source_id, adapter("SOURCE_REPOSITORY"))
        return Response(SourceSerializer(source).data)

    def put(self, request, source_id: str) -> Response:
        body = validated_body(SourceBodySerializer, request)
        use_cases.update_source(source_id, body, local_now().date(), adapter("SOURCE_REPOSITORY"))
        return changed(request, "Information source", {"source": source_id}, "updated")

    def delete(self, request, source_id: str) -> Response:
        use_cases.delete_source(source_id, _deps())
        return changed(request, "Information source", {"source": source_id}, "deleted")


class SafetyIncidentsView(ManageOnly, APIView):
    def get(self, request) -> Response:
        query = validated_query(IncidentQuerySerializer, request)
        incidents = use_cases.list_incidents(query, adapter("INCIDENT_REPOSITORY"))
        return Response({"incidents": IncidentSerializer(incidents, many=True).data})

    def post(self, request) -> Response:
        body = validated_body(IncidentBodySerializer, request)
        return created(request, "Incident", use_cases.create_incident(body, local_now(), _deps()))


class SafetyIncidentView(ManageOnly, APIView):
    def get(self, request, incident_id: str) -> Response:
        incident = use_cases.get_incident(incident_id, adapter("INCIDENT_REPOSITORY"))
        return Response(IncidentSerializer(incident).data)

    def put(self, request, incident_id: str) -> Response:
        body = validated_body(IncidentBodySerializer, request)
        use_cases.update_incident(incident_id, body, local_now(), _deps())
        return changed(request, "Incident", {"incident": incident_id}, "updated")

    def delete(self, request, incident_id: str) -> Response:
        use_cases.delete_incident(incident_id, _deps())
        return changed(request, "Incident", {"incident": incident_id}, "deleted")
