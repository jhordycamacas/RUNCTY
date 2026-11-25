from rest_framework import viewsets

from .models import Entrenamiento, MetaPersonal
from .serializers import EntrenamientoSerializer, MetaPersonalSerializer


class EntrenamientoViewSet(viewsets.ModelViewSet):
    """RF-12: entrenamientos con recorrido GPS; el ritmo lo calcula el servidor."""

    queryset = Entrenamiento.objects.select_related('usuario', 'ruta')
    serializer_class = EntrenamientoSerializer
    filterset_fields = ['usuario', 'ruta']
    ordering_fields = ['fecha_inicio', 'distancia_km']


class MetaPersonalViewSet(viewsets.ModelViewSet):
    """RF-13: metas personales."""

    queryset = MetaPersonal.objects.select_related('usuario')
    serializer_class = MetaPersonalSerializer
    filterset_fields = ['usuario', 'tipo', 'periodo', 'cumplida']
