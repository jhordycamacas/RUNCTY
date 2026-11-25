from rest_framework import viewsets

from .models import Ciudad, Zona
from .serializers import CiudadSerializer, ZonaSerializer


class CiudadViewSet(viewsets.ModelViewSet):
    """RF-04: listar, crear, consultar, modificar y eliminar ciudades."""

    queryset = Ciudad.objects.all()
    serializer_class = CiudadSerializer
    filterset_fields = ['activa']
    search_fields = ['nombre', 'provincia']
    ordering_fields = ['nombre']


class ZonaViewSet(viewsets.ModelViewSet):
    """RF-04: zonas de una ciudad (filtrar con ?ciudad=)."""

    queryset = Zona.objects.select_related('ciudad')
    serializer_class = ZonaSerializer
    filterset_fields = ['ciudad', 'tipo']
    search_fields = ['nombre']
    ordering_fields = ['nombre']
