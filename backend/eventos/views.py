from rest_framework import viewsets

from .models import Evento, Inscripcion
from .serializers import EventoSerializer, InscripcionSerializer


class EventoViewSet(viewsets.ModelViewSet):
    """RF-23: eventos y carreras."""

    queryset = Evento.objects.select_related('ciudad', 'ruta')
    serializer_class = EventoSerializer
    filterset_fields = ['ciudad', 'tipo', 'estado']
    search_fields = ['nombre', 'organizador']
    ordering_fields = ['fecha_inicio']


class InscripcionViewSet(viewsets.ModelViewSet):
    """RF-23: inscripciones a eventos (respetan el cupo)."""

    queryset = Inscripcion.objects.select_related('evento', 'usuario')
    serializer_class = InscripcionSerializer
    filterset_fields = ['evento', 'usuario', 'estado']
