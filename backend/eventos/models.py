from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from config.validadores import validar_fin_posterior


class Evento(models.Model):
    """RF-23: carrera o evento deportivo con cupo."""

    class Tipo(models.TextChoices):
        CARRERA = 'CARRERA', 'Carrera'
        CAMINATA = 'CAMINATA', 'Caminata'
        TRAIL = 'TRAIL', 'Trail'
        ENTRENAMIENTO = 'ENTRENAMIENTO', 'Entrenamiento abierto'

    class Estado(models.TextChoices):
        ABIERTO = 'ABIERTO', 'Inscripciones abiertas'
        CERRADO = 'CERRADO', 'Inscripciones cerradas'
        CANCELADO = 'CANCELADO', 'Cancelado'
        FINALIZADO = 'FINALIZADO', 'Finalizado'

    nombre = models.CharField(max_length=150)
    ciudad = models.ForeignKey('ciudades.Ciudad', on_delete=models.PROTECT, related_name='eventos')
    ruta = models.ForeignKey(
        'rutas.Ruta', on_delete=models.SET_NULL, null=True, blank=True, related_name='eventos'
    )
    organizador = models.CharField(max_length=120)
    tipo = models.CharField(max_length=13, choices=Tipo.choices, default=Tipo.CARRERA)
    descripcion = models.TextField(blank=True)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    distancia_km = models.DecimalField(
        max_digits=5, decimal_places=2, validators=[MinValueValidator(Decimal('0.1')), MaxValueValidator(200)]
    )
    cupo = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(50000)])
    costo = models.DecimalField(
        max_digits=7, decimal_places=2, default=0, validators=[MinValueValidator(0)],
        help_text='Solo informativo: RUNCTY no procesa pagos.',
    )
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.ABIERTO)

    class Meta:
        ordering = ['fecha_inicio']
        verbose_name = 'evento'
        verbose_name_plural = 'eventos'

    def __str__(self):
        return self.nombre

    def clean(self):
        validar_fin_posterior(self.fecha_inicio, self.fecha_fin)

    @property
    def cupos_disponibles(self):
        if self.pk is None:
            return self.cupo
        confirmadas = self.inscripciones.filter(estado=Inscripcion.Estado.CONFIRMADA).count()
        return max(0, self.cupo - confirmadas)


class Inscripcion(models.Model):
    """RF-23: inscripción de un usuario a un evento, limitada por el cupo."""

    class Estado(models.TextChoices):
        CONFIRMADA = 'CONFIRMADA', 'Confirmada'
        CANCELADA = 'CANCELADA', 'Cancelada'

    evento = models.ForeignKey(Evento, on_delete=models.CASCADE, related_name='inscripciones')
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='inscripciones')
    categoria = models.CharField(max_length=60, blank=True, help_text='Ej.: 5K, 10K, Máster')
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.CONFIRMADA)
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['evento', 'creada']
        verbose_name = 'inscripción'
        verbose_name_plural = 'inscripciones'
        constraints = [
            models.UniqueConstraint(fields=['evento', 'usuario'], name='inscripcion_unica_por_evento')
        ]

    def __str__(self):
        return f'{self.usuario} en {self.evento}'

    def clean(self):
        if not self.evento_id or self.estado != self.Estado.CONFIRMADA:
            return
        evento = self.evento
        if self._state.adding and evento.estado != Evento.Estado.ABIERTO:
            raise ValidationError({'evento': 'El evento no tiene las inscripciones abiertas.'})
        confirmadas = evento.inscripciones.filter(estado=self.Estado.CONFIRMADA).exclude(pk=self.pk).count()
        if confirmadas >= evento.cupo:
            raise ValidationError({'evento': 'El evento ya no tiene cupos disponibles.'})
