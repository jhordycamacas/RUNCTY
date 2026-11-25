from rest_framework import viewsets

from .models import (
    AlertaZona, FactorRiesgo, FranjaHoraria, FuenteInformacion, Incidente, SolicitudRutaSegura,
)
from .serializers import (
    AlertaZonaSerializer, FactorRiesgoSerializer, FranjaHorariaSerializer,
    FuenteInformacionSerializer, IncidenteSerializer, SolicitudRutaSeguraSerializer,
)


class FranjaHorariaViewSet(viewsets.ModelViewSet):
    """RF-07: franjas horarias de una ruta (no se solapan)."""

    queryset = FranjaHoraria.objects.select_related('ruta')
    serializer_class = FranjaHorariaSerializer
    filterset_fields = ['ruta']
    ordering_fields = ['hora_inicio']


class FactorRiesgoViewSet(viewsets.ModelViewSet):
    """RF-07: factores de riesgo por tramo y franja."""

    queryset = FactorRiesgo.objects.select_related('tramo__ruta', 'franja__ruta')
    serializer_class = FactorRiesgoSerializer
    filterset_fields = ['tramo', 'franja', 'tramo__ruta', 'severidad', 'tipo', 'activo']


class AlertaZonaViewSet(viewsets.ModelViewSet):
    """RF-07: alertas de seguridad por zona."""

    queryset = AlertaZona.objects.select_related('zona')
    serializer_class = AlertaZonaSerializer
    filterset_fields = ['zona', 'zona__ciudad', 'nivel', 'activa']
    search_fields = ['titulo']


class FuenteInformacionViewSet(viewsets.ModelViewSet):
    """RF-08: fuentes de información de seguridad."""

    queryset = FuenteInformacion.objects.all()
    serializer_class = FuenteInformacionSerializer
    filterset_fields = ['tipo']
    search_fields = ['nombre']


class IncidenteViewSet(viewsets.ModelViewSet):
    """RF-08: incidentes de seguridad."""

    queryset = Incidente.objects.select_related('zona', 'ruta', 'fuente')
    serializer_class = IncidenteSerializer
    filterset_fields = ['zona', 'zona__ciudad', 'ruta', 'fuente', 'tipo']
    ordering_fields = ['fecha']


class SolicitudRutaSeguraViewSet(viewsets.ModelViewSet):
    """RF-09: al crear una solicitud se devuelven las rutas ordenadas por seguridad para esa hora."""

    queryset = SolicitudRutaSegura.objects.select_related('usuario', 'ciudad')
    serializer_class = SolicitudRutaSeguraSerializer
    filterset_fields = ['usuario', 'ciudad']
