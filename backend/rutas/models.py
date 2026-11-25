from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinLengthValidator, MinValueValidator
from django.db import models

from config.validadores import VALIDAR_LATITUD, VALIDAR_LONGITUD, validar_fin_posterior

VALIDAR_DISTANCIA = [MinValueValidator(Decimal('0.1')), MaxValueValidator(100)]


class Ruta(models.Model):
    """RF-05: ruta del catálogo de una ciudad."""

    class Dificultad(models.TextChoices):
        FACIL = 'FACIL', 'Fácil'
        MEDIA = 'MEDIA', 'Media'
        DIFICIL = 'DIFICIL', 'Difícil'

    class Superficie(models.TextChoices):
        ASFALTO = 'ASFALTO', 'Asfalto'
        TIERRA = 'TIERRA', 'Tierra'
        MIXTA = 'MIXTA', 'Mixta'

    ciudad = models.ForeignKey('ciudades.Ciudad', on_delete=models.PROTECT, related_name='rutas')
    nombre = models.CharField(max_length=120, validators=[MinLengthValidator(3)])
    descripcion = models.TextField(blank=True)
    distancia_km = models.DecimalField(max_digits=5, decimal_places=2, validators=VALIDAR_DISTANCIA)
    dificultad = models.CharField(max_length=8, choices=Dificultad.choices, default=Dificultad.MEDIA)
    superficie = models.CharField(max_length=8, choices=Superficie.choices, default=Superficie.ASFALTO)
    activa = models.BooleanField(default=True)
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['ciudad', 'nombre']
        verbose_name = 'ruta'
        verbose_name_plural = 'rutas'
        constraints = [
            models.UniqueConstraint(fields=['ciudad', 'nombre'], name='ruta_unica_por_ciudad')
        ]

    def __str__(self):
        return self.nombre


class Tramo(models.Model):
    """RF-05: segmento de una ruta. El índice de seguridad se calcula por tramo."""

    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='tramos')
    orden = models.PositiveSmallIntegerField(validators=[MinValueValidator(1)])
    nombre = models.CharField(max_length=120)
    distancia_km = models.DecimalField(max_digits=5, decimal_places=2, validators=VALIDAR_DISTANCIA)
    zona = models.ForeignKey(
        'ciudades.Zona', on_delete=models.SET_NULL, null=True, blank=True, related_name='tramos'
    )

    class Meta:
        ordering = ['ruta', 'orden']
        verbose_name = 'tramo'
        verbose_name_plural = 'tramos'
        constraints = [
            models.UniqueConstraint(fields=['ruta', 'orden'], name='tramo_orden_unico_por_ruta')
        ]

    def __str__(self):
        return f'{self.ruta} - tramo {self.orden}: {self.nombre}'

    def clean(self):
        if self.zona_id and self.ruta_id and self.zona.ciudad_id != self.ruta.ciudad_id:
            raise ValidationError({'zona': 'La zona debe pertenecer a la ciudad de la ruta.'})


class PuntoApoyo(models.Model):
    """RF-06: lugar donde un corredor puede pedir ayuda."""

    class Tipo(models.TextChoices):
        COMERCIO_ABIERTO = 'COMERCIO_ABIERTO', 'Comercio abierto'
        PUESTO_POLICIAL = 'PUESTO_POLICIAL', 'Puesto policial'
        CENTRO_SALUD = 'CENTRO_SALUD', 'Centro de salud'
        LUGAR_CONCURRIDO = 'LUGAR_CONCURRIDO', 'Lugar concurrido'

    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='puntos_apoyo')
    nombre = models.CharField(max_length=120)
    tipo = models.CharField(max_length=20, choices=Tipo.choices)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, validators=VALIDAR_LATITUD)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, validators=VALIDAR_LONGITUD)
    horario = models.CharField(max_length=100, blank=True, help_text='Ej.: Lunes a sábado 06:00-22:00')

    class Meta:
        ordering = ['ruta', 'nombre']
        verbose_name = 'punto de apoyo'
        verbose_name_plural = 'puntos de apoyo'

    def __str__(self):
        return f'{self.nombre} ({self.get_tipo_display()})'


class SenderoResguardado(models.Model):
    """RF-06: horario en que una ruta tiene resguardo policial."""

    ruta = models.ForeignKey(Ruta, on_delete=models.CASCADE, related_name='senderos_resguardados')
    institucion = models.CharField(max_length=120, default='Policía Nacional')
    dias = models.CharField(max_length=100, help_text='Ej.: Lunes a viernes')
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['ruta', 'hora_inicio']
        verbose_name = 'sendero resguardado'
        verbose_name_plural = 'senderos resguardados'

    def __str__(self):
        return f'{self.ruta} - {self.institucion} {self.hora_inicio:%H:%M}-{self.hora_fin:%H:%M}'

    def clean(self):
        validar_fin_posterior(self.hora_inicio, self.hora_fin, 'hora_fin')
