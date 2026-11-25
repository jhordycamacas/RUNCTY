"""Respuestas de error comunes de la API."""
from django.db.models import ProtectedError, RestrictedError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import exception_handler


def manejar_excepcion(exc, context):
    """Igual que DRF, pero un borrado bloqueado por relaciones responde 409 en vez de 500."""
    if isinstance(exc, (ProtectedError, RestrictedError)):
        return Response(
            {'detail': 'No se puede eliminar: hay otros registros que dependen de este.'},
            status=status.HTTP_409_CONFLICT,
        )
    return exception_handler(exc, context)
