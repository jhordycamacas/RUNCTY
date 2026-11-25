from datetime import date

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinLengthValidator, MinValueValidator
from django.db import models
from django.utils import timezone

EDAD_MINIMA = 12


class Rol(models.Model):
    """RF-02: rol del usuario (Corredor, Administrador, Representante de club)."""

    nombre = models.CharField(max_length=50, unique=True, validators=[MinLengthValidator(3)])
    descripcion = models.TextField(blank=True)
    permisos = models.TextField(
        blank=True, help_text='Permisos separados por comas, por ejemplo: rutas.ver,reportes.validar'
    )

    class Meta:
        ordering = ['nombre']
        verbose_name = 'rol'
        verbose_name_plural = 'roles'

    def __str__(self):
        return self.nombre


class Usuario(models.Model):
    """RF-01: corredor o usuario de la plataforma (modelo de dominio, no es el usuario de Django)."""

    class Nivel(models.TextChoices):
        PRINCIPIANTE = 'PRINCIPIANTE', 'Principiante'
        INTERMEDIO = 'INTERMEDIO', 'Intermedio'
        AVANZADO = 'AVANZADO', 'Avanzado'

    nombre = models.CharField(max_length=80, validators=[MinLengthValidator(2)])
    apellido = models.CharField(max_length=80, validators=[MinLengthValidator(2)])
    correo = models.EmailField(unique=True)
    fecha_nacimiento = models.DateField()
    ciudad = models.ForeignKey('ciudades.Ciudad', on_delete=models.PROTECT, related_name='usuarios')
    rol = models.ForeignKey(Rol, on_delete=models.PROTECT, related_name='usuarios')
    nivel = models.CharField(max_length=12, choices=Nivel.choices, default=Nivel.PRINCIPIANTE)
    acepta_terminos = models.BooleanField(
        default=False, help_text='Consentimiento de tratamiento de datos (LOPDP).'
    )
    activo = models.BooleanField(default=True)
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['apellido', 'nombre']
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'

    def __str__(self):
        return f'{self.nombre} {self.apellido}'

    def clean(self):
        if self.fecha_nacimiento:
            hoy = timezone.localdate()
            if self.fecha_nacimiento > hoy:
                raise ValidationError({'fecha_nacimiento': 'La fecha de nacimiento no puede estar en el futuro.'})
            limite = date(hoy.year - EDAD_MINIMA, hoy.month, min(hoy.day, 28))
            if self.fecha_nacimiento > limite:
                raise ValidationError(
                    {'fecha_nacimiento': f'El usuario debe tener al menos {EDAD_MINIMA} años.'}
                )


class PerfilDeportivo(models.Model):
    """RF-01: perfil deportivo del usuario (1 a 1)."""

    class Objetivo(models.TextChoices):
        SALUD = 'SALUD', 'Salud'
        BAJAR_PESO = 'BAJAR_PESO', 'Bajar de peso'
        PREPARAR_CARRERA = 'PREPARAR_CARRERA', 'Preparar una carrera'
        MEJORAR_RITMO = 'MEJORAR_RITMO', 'Mejorar el ritmo'
        SOCIALIZAR = 'SOCIALIZAR', 'Socializar'

    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='perfil_deportivo')
    peso_kg = models.DecimalField(
        max_digits=5, decimal_places=1, validators=[MinValueValidator(25), MaxValueValidator(250)]
    )
    estatura_cm = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(100), MaxValueValidator(230)]
    )
    objetivo = models.CharField(max_length=20, choices=Objetivo.choices, default=Objetivo.SALUD)
    km_semanales = models.DecimalField(
        max_digits=5, decimal_places=1, default=0,
        validators=[MinValueValidator(0), MaxValueValidator(300)],
    )
    ritmo_objetivo_min_km = models.DecimalField(
        'ritmo objetivo (min/km)', max_digits=4, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(2), MaxValueValidator(20)],
    )

    class Meta:
        ordering = ['usuario']
        verbose_name = 'perfil deportivo'
        verbose_name_plural = 'perfiles deportivos'

    def __str__(self):
        return f'Perfil de {self.usuario}'


class Preferencia(models.Model):
    """RF-01: preferencias de la aplicación (1 a 1)."""

    class Tema(models.TextChoices):
        CLARO = 'CLARO', 'Claro'
        OSCURO = 'OSCURO', 'Oscuro'

    class TamanoLetra(models.TextChoices):
        NORMAL = 'NORMAL', 'Normal'
        GRANDE = 'GRANDE', 'Grande'

    class Unidad(models.TextChoices):
        KM = 'KM', 'Kilómetros'
        MI = 'MI', 'Millas'

    usuario = models.OneToOneField(Usuario, on_delete=models.CASCADE, related_name='preferencia')
    notificaciones = models.BooleanField(default=True)
    tema = models.CharField(max_length=6, choices=Tema.choices, default=Tema.CLARO)
    tamano_letra = models.CharField(max_length=6, choices=TamanoLetra.choices, default=TamanoLetra.NORMAL)
    unidad_distancia = models.CharField(max_length=2, choices=Unidad.choices, default=Unidad.KM)
    compartir_ubicacion = models.BooleanField(default=False)

    class Meta:
        ordering = ['usuario']
        verbose_name = 'preferencia'
        verbose_name_plural = 'preferencias'

    def __str__(self):
        return f'Preferencias de {self.usuario}'
