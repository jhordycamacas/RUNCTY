from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinLengthValidator, MinValueValidator
from django.db import models
from django.utils import timezone

from config.validadores import VALIDAR_LATITUD, VALIDAR_LONGITUD


class Club(models.Model):
    """RF-19: club de corredores de una ciudad."""

    nombre = models.CharField(max_length=120, unique=True, validators=[MinLengthValidator(3)])
    ciudad = models.ForeignKey('ciudades.Ciudad', on_delete=models.PROTECT, related_name='clubes')
    representante = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.SET_NULL, null=True, blank=True, related_name='clubes_representados'
    )
    descripcion = models.TextField(blank=True)
    correo = models.EmailField(blank=True)
    fecha_fundacion = models.DateField(null=True, blank=True)
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'club'
        verbose_name_plural = 'clubes'

    def __str__(self):
        return self.nombre

    def clean(self):
        if self.fecha_fundacion and self.fecha_fundacion > timezone.localdate():
            raise ValidationError({'fecha_fundacion': 'La fecha de fundación no puede estar en el futuro.'})


class Membresia(models.Model):
    """RF-19: pertenencia de un usuario a un club."""

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ACEPTADA = 'ACEPTADA', 'Aceptada'
        ACTIVA = 'ACTIVA', 'Activa'
        SUSPENDIDA = 'SUSPENDIDA', 'Suspendida'

    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='membresias')
    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='membresias')
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PENDIENTE)
    fecha_solicitud = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['club', '-fecha_solicitud']
        verbose_name = 'membresía'
        verbose_name_plural = 'membresías'
        constraints = [
            models.UniqueConstraint(fields=['club', 'usuario'], name='membresia_unica_por_club')
        ]

    def __str__(self):
        return f'{self.usuario} en {self.club} ({self.get_estado_display()})'


class RutaClub(models.Model):
    """RF-11: ruta sugerida por un club (de su misma ciudad)."""

    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='rutas_sugeridas')
    ruta = models.ForeignKey('rutas.Ruta', on_delete=models.CASCADE, related_name='clubes_que_sugieren')
    comentario = models.CharField(max_length=255, blank=True)
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['club', 'ruta']
        verbose_name = 'ruta sugerida por club'
        verbose_name_plural = 'rutas sugeridas por clubes'
        constraints = [models.UniqueConstraint(fields=['club', 'ruta'], name='ruta_club_unica')]

    def __str__(self):
        return f'{self.club} sugiere {self.ruta}'

    def clean(self):
        if self.club_id and self.ruta_id and self.club.ciudad_id != self.ruta.ciudad_id:
            raise ValidationError({'ruta': 'El club solo puede sugerir rutas de su ciudad.'})


class PuntoEncuentro(models.Model):
    """RF-20: lugar donde se reúne el club antes de salir."""

    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='puntos_encuentro')
    nombre = models.CharField(max_length=120)
    referencia = models.CharField(max_length=255, blank=True)
    latitud = models.DecimalField(max_digits=9, decimal_places=6, validators=VALIDAR_LATITUD)
    longitud = models.DecimalField(max_digits=9, decimal_places=6, validators=VALIDAR_LONGITUD)

    class Meta:
        ordering = ['club', 'nombre']
        verbose_name = 'punto de encuentro'
        verbose_name_plural = 'puntos de encuentro'

    def __str__(self):
        return f'{self.nombre} ({self.club})'


class SalidaGrupal(models.Model):
    """RF-21: salida del club con cupo limitado."""

    class Estado(models.TextChoices):
        PROGRAMADA = 'PROGRAMADA', 'Programada'
        REALIZADA = 'REALIZADA', 'Realizada'
        CANCELADA = 'CANCELADA', 'Cancelada'

    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='salidas')
    ruta = models.ForeignKey('rutas.Ruta', on_delete=models.CASCADE, related_name='salidas_grupales')
    punto_encuentro = models.ForeignKey(
        PuntoEncuentro, on_delete=models.SET_NULL, null=True, blank=True, related_name='salidas'
    )
    titulo = models.CharField(max_length=120)
    fecha_hora = models.DateTimeField()
    cupo = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(500)])
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PROGRAMADA)

    class Meta:
        ordering = ['-fecha_hora']
        verbose_name = 'salida grupal'
        verbose_name_plural = 'salidas grupales'

    def __str__(self):
        return f'{self.titulo} ({self.fecha_hora:%Y-%m-%d %H:%M})'

    def clean(self):
        if self.punto_encuentro_id and self.club_id and self.punto_encuentro.club_id != self.club_id:
            raise ValidationError({'punto_encuentro': 'El punto de encuentro debe ser del mismo club.'})
