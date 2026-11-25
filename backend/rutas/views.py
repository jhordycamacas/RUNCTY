from rest_framework import viewsets

from .models import PuntoApoyo, Ruta, SenderoResguardado, Tramo
from .serializers import (
    PuntoApoyoSerializer, RutaSerializer, SenderoResguardadoSerializer, TramoSerializer,
)


class RutaViewSet(viewsets.ModelViewSet):
    """RF-05 y RF-07: rutas con su índice de seguridad calculado por franja (filtrar con ?ciudad=)."""

    queryset = Ruta.objects.select_related('ciudad').prefetch_related('franjas', 'tramos__factores')
    serializer_class = RutaSerializer
    filterset_fields = ['ciudad', 'dificultad', 'superficie', 'activa']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['nombre', 'distancia_km']


class TramoViewSet(viewsets.ModelViewSet):
    """RF-05: tramos de una ruta (filtrar con ?ruta=)."""

    queryset = Tramo.objects.select_related('ruta', 'zona')
    serializer_class = TramoSerializer
    filterset_fields = ['ruta', 'zona']
    ordering_fields = ['orden']


class PuntoApoyoViewSet(viewsets.ModelViewSet):
    """RF-06: puntos de apoyo de una ruta."""

    queryset = PuntoApoyo.objects.select_related('ruta')
    serializer_class = PuntoApoyoSerializer
    filterset_fields = ['ruta', 'tipo']
    search_fields = ['nombre']


class SenderoResguardadoViewSet(viewsets.ModelViewSet):
    """RF-06: horarios de resguardo policial de una ruta."""

    queryset = SenderoResguardado.objects.select_related('ruta')
    serializer_class = SenderoResguardadoSerializer
    filterset_fields = ['ruta', 'activo']
