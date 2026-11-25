from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from config.validadores import validar_fin_posterior


class Entrenamiento(models.Model):
    """RF-12: sesión de carrera con su recorrido GPS. El ritmo se calcula."""

    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='entrenamientos')
    ruta = models.ForeignKey(
        'rutas.Ruta', on_delete=models.SET_NULL, null=True, blank=True, related_name='entrenamientos'
    )
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField()
    distancia_km = models.DecimalField(
        max_digits=6, decimal_places=2, validators=[MinValueValidator(Decimal('0.01')), MaxValueValidator(300)]
    )
    calorias = models.PositiveIntegerField(null=True, blank=True, validators=[MaxValueValidator(20000)])
    puntos_gps = models.JSONField(
        default=list, blank=True, help_text='Lista de puntos {"lat": -3.99, "lng": -79.2}.'
    )
    notas = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ['-fecha_inicio']
        verbose_name = 'entrenamiento'
        verbose_name_plural = 'entrenamientos'

    def __str__(self):
        return f'{self.usuario} - {self.distancia_km} km ({self.fecha_inicio:%Y-%m-%d})'

    @property
    def duracion_min(self):
        if not (self.fecha_inicio and self.fecha_fin):
            return None
        return round((self.fecha_fin - self.fecha_inicio).total_seconds() / 60, 2)

    @property
    def ritmo_min_km(self):
        """Minutos por kilómetro."""
        if not self.duracion_min or not self.distancia_km:
            return None
        return round(Decimal(str(self.duracion_min)) / Decimal(self.distancia_km), 2)

    def clean(self):
        validar_fin_posterior(self.fecha_inicio, self.fecha_fin)
        if self.fecha_inicio and self.fecha_inicio > timezone.now():
            raise ValidationError({'fecha_inicio': 'No se puede registrar un entrenamiento futuro.'})
        if not isinstance(self.puntos_gps, list):
            raise ValidationError({'puntos_gps': 'Debe ser una lista de puntos.'})
        for punto in self.puntos_gps:
            if not (
                isinstance(punto, dict)
                and isinstance(punto.get('lat'), (int, float))
                and isinstance(punto.get('lng'), (int, float))
                and -90 <= punto['lat'] <= 90
                and -180 <= punto['lng'] <= 180
            ):
                raise ValidationError(
                    {'puntos_gps': 'Cada punto debe tener lat (-90 a 90) y lng (-180 a 180) numéricos.'}
                )


class MetaPersonal(models.Model):
    """RF-13: meta personal del corredor."""

    class Tipo(models.TextChoices):
        DISTANCIA = 'DISTANCIA', 'Distancia (km)'
        TIEMPO = 'TIEMPO', 'Tiempo (min)'
        FRECUENCIA = 'FRECUENCIA', 'Frecuencia (sesiones)'

    class Periodo(models.TextChoices):
        SEMANAL = 'SEMANAL', 'Semanal'
        MENSUAL = 'MENSUAL', 'Mensual'

    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='metas')
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    valor_objetivo = models.DecimalField(
        max_digits=7, decimal_places=2, validators=[MinValueValidator(Decimal('0.1')), MaxValueValidator(10000)]
    )
    periodo = models.CharField(max_length=7, choices=Periodo.choices, default=Periodo.SEMANAL)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    cumplida = models.BooleanField(default=False)

    class Meta:
        ordering = ['-fecha_inicio']
        verbose_name = 'meta personal'
        verbose_name_plural = 'metas personales'

    def __str__(self):
        return f'{self.usuario}: {self.valor_objetivo} {self.get_tipo_display()} ({self.get_periodo_display()})'

    def clean(self):
        validar_fin_posterior(self.fecha_inicio, self.fecha_fin)
