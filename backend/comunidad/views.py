from rest_framework import viewsets

from .models import (
    Favorita, Notificacion, ReporteComunitario, Reto, SolicitudCompanero, Valoracion,
)
from .serializers import (
    FavoritaSerializer, NotificacionSerializer, ReporteComunitarioSerializer, RetoSerializer,
    SolicitudCompaneroSerializer, ValoracionSerializer,
)


class FavoritaViewSet(viewsets.ModelViewSet):
    """RF-10: rutas favoritas (una vez por usuario y ruta)."""

    queryset = Favorita.objects.select_related('usuario', 'ruta')
    serializer_class = FavoritaSerializer
    filterset_fields = ['usuario', 'ruta']


class ValoracionViewSet(viewsets.ModelViewSet):
    """RF-10: valoraciones de 1 a 5 (una por usuario y ruta)."""

    queryset = Valoracion.objects.select_related('usuario', 'ruta')
    serializer_class = ValoracionSerializer
    filterset_fields = ['usuario', 'ruta']
    ordering_fields = ['creada', 'seguridad']


class RetoViewSet(viewsets.ModelViewSet):
    """RF-14: retos entre corredores."""

    queryset = Reto.objects.select_related('creador', 'retado')
    serializer_class = RetoSerializer
    filterset_fields = ['creador', 'retado', 'estado', 'tipo']
    search_fields = ['titulo']


class ReporteComunitarioViewSet(viewsets.ModelViewSet):
    """RF-17: reportes comunitarios (filtrar con ?estado=APROBADO para ver solo los públicos)."""

    queryset = ReporteComunitario.objects.select_related('ruta', 'zona')
    serializer_class = ReporteComunitarioSerializer
    filterset_fields = ['estado', 'tipo', 'ruta', 'zona']
    ordering_fields = ['creado']


class NotificacionViewSet(viewsets.ModelViewSet):
    """RF-18: notificaciones de un usuario."""

    queryset = Notificacion.objects.select_related('usuario')
    serializer_class = NotificacionSerializer
    filterset_fields = ['usuario', 'tipo', 'leida']


class SolicitudCompaneroViewSet(viewsets.ModelViewSet):
    """RF-22: solicitudes para correr acompañado."""

    queryset = SolicitudCompanero.objects.select_related('solicitante', 'receptor')
    serializer_class = SolicitudCompaneroSerializer
    filterset_fields = ['solicitante', 'receptor', 'estado']
