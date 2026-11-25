from django.core.validators import MinLengthValidator
from django.db import models


class Ciudad(models.Model):
    """RF-04: ciudad donde opera RUNCTY."""

    nombre = models.CharField(max_length=100, unique=True, validators=[MinLengthValidator(2)])
    provincia = models.CharField(max_length=100)
    pais = models.CharField(max_length=60, default='Ecuador')
    activa = models.BooleanField(default=True)
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['nombre']
        verbose_name = 'ciudad'
        verbose_name_plural = 'ciudades'

    def __str__(self):
        return self.nombre


class Zona(models.Model):
    """RF-04: zona o sector de una ciudad."""

    class Tipo(models.TextChoices):
        URBANA = 'URBANA', 'Urbana'
        RURAL = 'RURAL', 'Rural'
        PARQUE = 'PARQUE', 'Parque'

    ciudad = models.ForeignKey(Ciudad, on_delete=models.CASCADE, related_name='zonas')
    nombre = models.CharField(max_length=100, validators=[MinLengthValidator(2)])
    tipo = models.CharField(max_length=10, choices=Tipo.choices, default=Tipo.URBANA)
    descripcion = models.TextField(blank=True)

    class Meta:
        ordering = ['ciudad', 'nombre']
        verbose_name = 'zona'
        verbose_name_plural = 'zonas'
        constraints = [
            models.UniqueConstraint(fields=['ciudad', 'nombre'], name='zona_unica_por_ciudad')
        ]

    def __str__(self):
        return f'{self.nombre} ({self.ciudad})'
