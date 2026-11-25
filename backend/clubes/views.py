from rest_framework import viewsets

from .models import Club, Membresia, PuntoEncuentro, RutaClub, SalidaGrupal
from .serializers import (
    ClubSerializer, MembresiaSerializer, PuntoEncuentroSerializer, RutaClubSerializer,
    SalidaGrupalSerializer,
)


class ClubViewSet(viewsets.ModelViewSet):
    """RF-19: clubes de corredores."""

    queryset = Club.objects.select_related('ciudad', 'representante')
    serializer_class = ClubSerializer
    filterset_fields = ['ciudad', 'activo']
    search_fields = ['nombre']


class MembresiaViewSet(viewsets.ModelViewSet):
    """RF-19: membresías de los clubes."""

    queryset = Membresia.objects.select_related('club', 'usuario')
    serializer_class = MembresiaSerializer
    filterset_fields = ['club', 'usuario', 'estado']


class RutaClubViewSet(viewsets.ModelViewSet):
    """RF-11: rutas sugeridas por los clubes."""

    queryset = RutaClub.objects.select_related('club', 'ruta')
    serializer_class = RutaClubSerializer
    filterset_fields = ['club', 'ruta']


class PuntoEncuentroViewSet(viewsets.ModelViewSet):
    """RF-20: puntos de encuentro de los clubes."""

    queryset = PuntoEncuentro.objects.select_related('club')
    serializer_class = PuntoEncuentroSerializer
    filterset_fields = ['club']
    search_fields = ['nombre']


class SalidaGrupalViewSet(viewsets.ModelViewSet):
    """RF-21: salidas grupales con cupo."""

    queryset = SalidaGrupal.objects.select_related('club', 'ruta', 'punto_encuentro')
    serializer_class = SalidaGrupalSerializer
    filterset_fields = ['club', 'ruta', 'estado']
    ordering_fields = ['fecha_hora']
