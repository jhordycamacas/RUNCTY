from rest_framework import viewsets

from .models import AlertaPanico, ContactoConfianza, UbicacionCompartida
from .serializers import (
    AlertaPanicoSerializer, ContactoConfianzaSerializer, UbicacionCompartidaSerializer,
)


class ContactoConfianzaViewSet(viewsets.ModelViewSet):
    """RF-03: contactos de confianza de un usuario (filtrar con ?usuario=)."""

    queryset = ContactoConfianza.objects.select_related('usuario')
    serializer_class = ContactoConfianzaSerializer
    filterset_fields = ['usuario']
    search_fields = ['nombre', 'telefono']


class AlertaPanicoViewSet(viewsets.ModelViewSet):
    """RF-15: botón de pánico. Requiere al menos un contacto de confianza."""

    queryset = AlertaPanico.objects.select_related('usuario')
    serializer_class = AlertaPanicoSerializer
    filterset_fields = ['usuario', 'estado']
    ordering_fields = ['creada']


class UbicacionCompartidaViewSet(viewsets.ModelViewSet):
    """RF-16: ubicación compartida con un contacto de confianza."""

    queryset = UbicacionCompartida.objects.select_related('usuario', 'contacto')
    serializer_class = UbicacionCompartidaSerializer
    filterset_fields = ['usuario', 'contacto', 'activa']
