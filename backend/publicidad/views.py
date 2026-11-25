from rest_framework import viewsets

from .models import Anunciante, Campana
from .serializers import AnuncianteSerializer, CampanaSerializer


class AnuncianteViewSet(viewsets.ModelViewSet):
    """RF-24: anunciantes."""

    queryset = Anunciante.objects.all()
    serializer_class = AnuncianteSerializer
    filterset_fields = ['activo']
    search_fields = ['nombre', 'ruc']


class CampanaViewSet(viewsets.ModelViewSet):
    """RF-24: campañas publicitarias con vigencia."""

    queryset = Campana.objects.select_related('anunciante')
    serializer_class = CampanaSerializer
    filterset_fields = ['anunciante', 'espacio', 'activa']
    search_fields = ['nombre']
    ordering_fields = ['fecha_inicio', 'fecha_fin']
