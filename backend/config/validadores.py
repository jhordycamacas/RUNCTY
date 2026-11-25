"""Validadores de campo reutilizados por varias aplicaciones."""
from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.utils import timezone

VALIDAR_LATITUD = [MinValueValidator(-90), MaxValueValidator(90)]
VALIDAR_LONGITUD = [MinValueValidator(-180), MaxValueValidator(180)]
VALIDAR_CALIFICACION = [MinValueValidator(1), MaxValueValidator(5)]

validar_telefono = RegexValidator(
    r'^\+?\d{7,15}$', 'El teléfono debe tener entre 7 y 15 dígitos (puede empezar con +).'
)


def validar_fecha_no_futura(valor):
    """Rechaza fechas (o fechas y horas) posteriores a hoy."""
    hoy = timezone.localdate()
    fecha = valor.date() if hasattr(valor, 'date') and callable(valor.date) else valor
    if fecha > hoy:
        raise ValidationError('La fecha no puede estar en el futuro.')


def validar_fin_posterior(inicio, fin, campo_fin='fecha_fin', permitir_igual=False):
    """Lanza un error en campo_fin si fin no es posterior a inicio."""
    if inicio is None or fin is None:
        return
    if fin < inicio or (fin == inicio and not permitir_igual):
        mensaje = (
            'Debe ser igual o posterior al inicio.' if permitir_igual else 'Debe ser posterior al inicio.'
        )
        raise ValidationError({campo_fin: mensaje})
