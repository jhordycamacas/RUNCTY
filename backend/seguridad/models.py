from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from config.validadores import VALIDAR_LATITUD, VALIDAR_LONGITUD, validar_fin_posterior


class Severidad(models.TextChoices):
    BAJA = 'BAJA', 'Baja'
    MEDIA = 'MEDIA', 'Media'
    ALTA = 'ALTA', 'Alta'


class FranjaHoraria(models.Model):
    """RF-07: franja del día en que se evalúa la seguridad de una ruta. No se solapan."""

    ruta = models.ForeignKey('rutas.Ruta', on_delete=models.CASCADE, related_name='franjas')
    nombre = models.CharField(max_length=60, help_text='Ej.: Madrugada, Tarde')
    hora_inicio = models.TimeField()
    hora_fin = models.TimeField()

    class Meta:
        ordering = ['ruta', 'hora_inicio']
        verbose_name = 'franja horaria'
        verbose_name_plural = 'franjas horarias'

    def __str__(self):
        return f'{self.ruta} {self.hora_inicio:%H:%M}-{self.hora_fin:%H:%M}'

    def clean(self):
        validar_fin_posterior(self.hora_inicio, self.hora_fin, 'hora_fin')
        if not (self.ruta_id and self.hora_inicio and self.hora_fin):
            return
        solapadas = FranjaHoraria.objects.filter(
            ruta_id=self.ruta_id, hora_inicio__lt=self.hora_fin, hora_fin__gt=self.hora_inicio
        ).exclude(pk=self.pk)
        if solapadas.exists():
            raise ValidationError(
                {'hora_inicio': f'La franja se solapa con otra franja de la ruta: {solapadas.first()}.'}
            )


class FactorRiesgo(models.Model):
    """RF-07: factor que baja la seguridad de un tramo en una franja."""

    class Tipo(models.TextChoices):
        ILUMINACION = 'ILUMINACION', 'Poca iluminación'
        DELINCUENCIA = 'DELINCUENCIA', 'Delincuencia'
        TRAFICO = 'TRAFICO', 'Tráfico vehicular'
        TERRENO = 'TERRENO', 'Terreno en mal estado'
        PERROS = 'PERROS', 'Perros sueltos'
        SOLEDAD = 'SOLEDAD', 'Zona solitaria'
        OTRO = 'OTRO', 'Otro'

    tramo = models.ForeignKey('rutas.Tramo', on_delete=models.CASCADE, related_name='factores')
    franja = models.ForeignKey(FranjaHoraria, on_delete=models.CASCADE, related_name='factores')
    tipo = models.CharField(max_length=12, choices=Tipo.choices)
    severidad = models.CharField(max_length=5, choices=Severidad.choices, default=Severidad.MEDIA)
    descripcion = models.CharField(max_length=255, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['tramo', 'franja', 'tipo']
        verbose_name = 'factor de riesgo'
        verbose_name_plural = 'factores de riesgo'

    def __str__(self):
        return f'{self.get_tipo_display()} ({self.get_severidad_display()}) - {self.tramo}'

    def clean(self):
        if self.tramo_id and self.franja_id and self.tramo.ruta_id != self.franja.ruta_id:
            raise ValidationError({'franja': 'La franja debe pertenecer a la misma ruta que el tramo.'})


class AlertaZona(models.Model):
    """RF-07: aviso temporal sobre una zona de la ciudad."""

    class Nivel(models.TextChoices):
        INFORMATIVA = 'INFORMATIVA', 'Informativa'
        PRECAUCION = 'PRECAUCION', 'Precaución'
        PELIGRO = 'PELIGRO', 'Peligro'

    zona = models.ForeignKey('ciudades.Zona', on_delete=models.CASCADE, related_name='alertas')
    titulo = models.CharField(max_length=120)
    descripcion = models.TextField(blank=True)
    nivel = models.CharField(max_length=12, choices=Nivel.choices, default=Nivel.PRECAUCION)
    fecha_inicio = models.DateTimeField()
    fecha_fin = models.DateTimeField(null=True, blank=True)
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ['-fecha_inicio']
        verbose_name = 'alerta de zona'
        verbose_name_plural = 'alertas de zona'

    def __str__(self):
        return f'{self.titulo} ({self.zona})'

    def clean(self):
        validar_fin_posterior(self.fecha_inicio, self.fecha_fin)


class FuenteInformacion(models.Model):
    """RF-08: origen de los datos de seguridad."""

    class Tipo(models.TextChoices):
        POLICIA = 'POLICIA', 'Policía'
        MUNICIPIO = 'MUNICIPIO', 'Municipio'
        CLUB = 'CLUB', 'Club'
        COMUNIDAD = 'COMUNIDAD', 'Comunidad'
        ADMINISTRADOR = 'ADMINISTRADOR', 'Administrador'

    nombre = models.CharField(max_length=120, unique=True)
    tipo = models.CharField(max_length=14, choices=Tipo.choices)
    confiabilidad = models.PositiveSmallIntegerField(
        default=3, validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='De 1 (poco confiable) a 5 (muy confiable).',
    )
    contacto = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'fuente de información'
        verbose_name_plural = 'fuentes de información'

    def __str__(self):
        return self.nombre


class Incidente(models.Model):
    """RF-08: hecho de inseguridad registrado en una zona."""

    class Tipo(models.TextChoices):
        ROBO = 'ROBO', 'Robo'
        ASALTO = 'ASALTO', 'Asalto'
        ACOSO = 'ACOSO', 'Acoso'
        ACCIDENTE = 'ACCIDENTE', 'Accidente'
        OTRO = 'OTRO', 'Otro'

    zona = models.ForeignKey('ciudades.Zona', on_delete=models.CASCADE, related_name='incidentes')
    ruta = models.ForeignKey(
        'rutas.Ruta', on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes'
    )
    fuente = models.ForeignKey(
        FuenteInformacion, on_delete=models.SET_NULL, null=True, blank=True, related_name='incidentes'
    )
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    descripcion = models.TextField()
    fecha = models.DateTimeField()
    latitud = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, validators=VALIDAR_LATITUD
    )
    longitud = models.DecimalField(
        max_digits=9, decimal_places=6, null=True, blank=True, validators=VALIDAR_LONGITUD
    )

    class Meta:
        ordering = ['-fecha']
        verbose_name = 'incidente'
        verbose_name_plural = 'incidentes'

    def __str__(self):
        return f'{self.get_tipo_display()} en {self.zona} ({self.fecha:%Y-%m-%d})'

    def clean(self):
        if self.fecha and self.fecha > timezone.now():
            raise ValidationError({'fecha': 'La fecha del incidente no puede estar en el futuro.'})


class SolicitudRutaSegura(models.Model):
    """RF-09: pedido de rutas recomendadas para una hora. La respuesta se calcula, no se guarda."""

    usuario = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.CASCADE, related_name='solicitudes_ruta_segura'
    )
    ciudad = models.ForeignKey('ciudades.Ciudad', on_delete=models.CASCADE, related_name='solicitudes_ruta_segura')
    hora = models.TimeField(help_text='Hora a la que el corredor quiere salir.')
    distancia_max_km = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(Decimal('0.1')), MaxValueValidator(100)],
    )
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creada']
        verbose_name = 'solicitud de ruta segura'
        verbose_name_plural = 'solicitudes de ruta segura'

    def __str__(self):
        return f'{self.usuario} - {self.ciudad} {self.hora:%H:%M}'
