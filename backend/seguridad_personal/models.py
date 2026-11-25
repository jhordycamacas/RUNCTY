from django.core.exceptions import ValidationError
from django.db import models
from django.utils import timezone

from config.validadores import (
    VALIDAR_LATITUD, VALIDAR_LONGITUD, validar_fin_posterior, validar_telefono,
)


class ContactoConfianza(models.Model):
    """RF-03: persona que recibe las alertas de pánico y la ubicación compartida."""

    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='contactos')
    nombre = models.CharField(max_length=120)
    telefono = models.CharField(max_length=16, validators=[validar_telefono])
    correo = models.EmailField(blank=True)
    parentesco = models.CharField(max_length=60, blank=True, help_text='Ej.: Madre, Amigo')

    class Meta:
        ordering = ['usuario', 'nombre']
        verbose_name = 'contacto de confianza'
        verbose_name_plural = 'contactos de confianza'
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'telefono'], name='contacto_unico_por_usuario')
        ]

    def __str__(self):
        return f'{self.nombre} ({self.telefono})'


class AlertaPanico(models.Model):
    """RF-15: alerta enviada con el botón de pánico. Exige al menos un contacto de confianza."""

    class Estado(models.TextChoices):
        ACTIVA = 'ACTIVA', 'Activa'
        ATENDIDA = 'ATENDIDA', 'Atendida'
        CANCELADA = 'CANCELADA', 'Cancelada'

    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='alertas_panico')
    latitud = models.DecimalField(max_digits=9, decimal_places=6, validators=VALIDAR_LATITUD)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, validators=VALIDAR_LONGITUD)
    mensaje = models.CharField(max_length=255, blank=True)
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.ACTIVA)
    creada = models.DateTimeField(auto_now_add=True)
    atendida_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-creada']
        verbose_name = 'alerta de pánico'
        verbose_name_plural = 'alertas de pánico'

    def __str__(self):
        return f'Alerta de {self.usuario} ({self.get_estado_display()})'

    def clean(self):
        if self._state.adding and self.usuario_id and not ContactoConfianza.objects.filter(
            usuario_id=self.usuario_id
        ).exists():
            raise ValidationError(
                {'usuario': 'El usuario debe registrar al menos un contacto de confianza antes de usar el botón de pánico.'}
            )

    def save(self, *args, **kwargs):
        if self.estado == self.Estado.ATENDIDA and self.atendida_en is None:
            self.atendida_en = timezone.now()
        super().save(*args, **kwargs)


class UbicacionCompartida(models.Model):
    """RF-16: ubicación que el corredor comparte con un contacto durante una sesión."""

    usuario = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.CASCADE, related_name='ubicaciones_compartidas'
    )
    contacto = models.ForeignKey(
        ContactoConfianza, on_delete=models.CASCADE, related_name='ubicaciones_compartidas'
    )
    latitud = models.DecimalField(max_digits=9, decimal_places=6, validators=VALIDAR_LATITUD)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, validators=VALIDAR_LONGITUD)
    inicio = models.DateTimeField(auto_now_add=True)
    fin = models.DateTimeField(null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ['-inicio']
        verbose_name = 'ubicación compartida'
        verbose_name_plural = 'ubicaciones compartidas'

    def __str__(self):
        return f'{self.usuario} comparte con {self.contacto.nombre}'

    def clean(self):
        if self.usuario_id and self.contacto_id and self.contacto.usuario_id != self.usuario_id:
            raise ValidationError({'contacto': 'El contacto debe ser un contacto de confianza del usuario.'})
        validar_fin_posterior(self.inicio, self.fin, 'fin')
