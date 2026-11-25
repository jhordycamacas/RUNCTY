from django.core.validators import RegexValidator
from django.db import models
from django.utils import timezone

from config.validadores import validar_fin_posterior, validar_telefono

validar_ruc = RegexValidator(r'^\d{13}$', 'El RUC debe tener 13 dígitos.')


class Anunciante(models.Model):
    """RF-24: empresa que publica campañas en RUNCTY."""

    nombre = models.CharField(max_length=120, unique=True)
    ruc = models.CharField('RUC', max_length=13, unique=True, validators=[validar_ruc])
    correo = models.EmailField()
    telefono = models.CharField(max_length=16, blank=True, validators=[validar_telefono])
    activo = models.BooleanField(default=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'anunciante'
        verbose_name_plural = 'anunciantes'

    def __str__(self):
        return self.nombre


class Campana(models.Model):
    """RF-24: campaña publicitaria con vigencia. Solo se muestra en espacios definidos."""

    class Espacio(models.TextChoices):
        INICIO = 'INICIO', 'Pantalla de inicio'
        RUTAS = 'RUTAS', 'Listado de rutas'
        EVENTOS = 'EVENTOS', 'Listado de eventos'

    anunciante = models.ForeignKey(Anunciante, on_delete=models.CASCADE, related_name='campanas')
    nombre = models.CharField(max_length=120)
    espacio = models.CharField(max_length=8, choices=Espacio.choices, default=Espacio.INICIO)
    imagen_url = models.URLField(blank=True)
    enlace = models.URLField(blank=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activa = models.BooleanField(default=True)

    class Meta:
        ordering = ['-fecha_inicio']
        verbose_name = 'campaña'
        verbose_name_plural = 'campañas'

    def __str__(self):
        return f'{self.nombre} ({self.anunciante})'

    def clean(self):
        validar_fin_posterior(self.fecha_inicio, self.fecha_fin, permitir_igual=True)

    @property
    def vigente(self):
        hoy = timezone.localdate()
        return self.activa and self.fecha_inicio <= hoy <= self.fecha_fin
