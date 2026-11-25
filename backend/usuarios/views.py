from rest_framework import viewsets

from .models import PerfilDeportivo, Preferencia, Rol, Usuario
from .serializers import (
    PerfilDeportivoSerializer, PreferenciaSerializer, RolSerializer, UsuarioSerializer,
)


class RolViewSet(viewsets.ModelViewSet):
    """RF-02: roles de la plataforma."""

    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    search_fields = ['nombre']
    ordering_fields = ['nombre']


class UsuarioViewSet(viewsets.ModelViewSet):
    """RF-01: usuarios. Al eliminar uno se eliminan su perfil y sus preferencias."""

    queryset = Usuario.objects.select_related('ciudad', 'rol')
    serializer_class = UsuarioSerializer
    filterset_fields = ['ciudad', 'rol', 'nivel', 'activo']
    search_fields = ['nombre', 'apellido', 'correo']
    ordering_fields = ['apellido', 'nombre', 'creado']


class PerfilDeportivoViewSet(viewsets.ModelViewSet):
    """RF-01: perfil deportivo (uno por usuario)."""

    queryset = PerfilDeportivo.objects.select_related('usuario')
    serializer_class = PerfilDeportivoSerializer
    filterset_fields = ['usuario', 'objetivo']


class PreferenciaViewSet(viewsets.ModelViewSet):
    """RF-01: preferencias de la aplicación (una por usuario)."""

    queryset = Preferencia.objects.select_related('usuario')
    serializer_class = PreferenciaSerializer
    filterset_fields = ['usuario']
