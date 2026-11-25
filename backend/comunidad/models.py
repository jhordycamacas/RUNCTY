from decimal import Decimal

from django.core.exceptions import ValidationError
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models

from config.validadores import VALIDAR_CALIFICACION, validar_fin_posterior


class Favorita(models.Model):
    """RF-10: ruta marcada como favorita por un usuario."""

    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='favoritas')
    ruta = models.ForeignKey('rutas.Ruta', on_delete=models.CASCADE, related_name='favoritas')
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creada']
        verbose_name = 'ruta favorita'
        verbose_name_plural = 'rutas favoritas'
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'ruta'], name='favorita_unica_por_usuario')
        ]

    def __str__(self):
        return f'{self.usuario} - {self.ruta}'


class Valoracion(models.Model):
    """RF-10: calificación de 1 a 5 de una ruta. Una sola por usuario y ruta."""

    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='valoraciones')
    ruta = models.ForeignKey('rutas.Ruta', on_delete=models.CASCADE, related_name='valoraciones')
    seguridad = models.PositiveSmallIntegerField(validators=VALIDAR_CALIFICACION)
    iluminacion = models.PositiveSmallIntegerField(validators=VALIDAR_CALIFICACION)
    afluencia = models.PositiveSmallIntegerField(validators=VALIDAR_CALIFICACION)
    comentario = models.CharField(max_length=255, blank=True)
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creada']
        verbose_name = 'valoración'
        verbose_name_plural = 'valoraciones'
        constraints = [
            models.UniqueConstraint(fields=['usuario', 'ruta'], name='valoracion_unica_por_usuario')
        ]

    def __str__(self):
        return f'{self.usuario} valoró {self.ruta}'

    @property
    def promedio(self):
        return round((self.seguridad + self.iluminacion + self.afluencia) / 3, 2)


class Reto(models.Model):
    """RF-14: reto entre dos corredores."""

    class Tipo(models.TextChoices):
        DISTANCIA = 'DISTANCIA', 'Distancia (km)'
        TIEMPO = 'TIEMPO', 'Tiempo (min)'
        FRECUENCIA = 'FRECUENCIA', 'Frecuencia (sesiones)'

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ACEPTADO = 'ACEPTADO', 'Aceptado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'
        FINALIZADO = 'FINALIZADO', 'Finalizado'

    creador = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='retos_creados')
    retado = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='retos_recibidos')
    titulo = models.CharField(max_length=120)
    tipo = models.CharField(max_length=10, choices=Tipo.choices)
    valor_objetivo = models.DecimalField(
        max_digits=7, decimal_places=2, validators=[MinValueValidator(Decimal('0.1')), MaxValueValidator(10000)]
    )
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PENDIENTE)

    class Meta:
        ordering = ['-fecha_inicio']
        verbose_name = 'reto'
        verbose_name_plural = 'retos'

    def __str__(self):
        return self.titulo

    def clean(self):
        if self.creador_id and self.creador_id == self.retado_id:
            raise ValidationError({'retado': 'Un corredor no puede retarse a sí mismo.'})
        validar_fin_posterior(self.fecha_inicio, self.fecha_fin)


class ReporteComunitario(models.Model):
    """RF-17: reporte de un corredor sobre una ruta o zona. Solo es público si se aprueba."""

    class Tipo(models.TextChoices):
        INSEGURIDAD = 'INSEGURIDAD', 'Inseguridad'
        ILUMINACION = 'ILUMINACION', 'Falta de iluminación'
        OBSTACULO = 'OBSTACULO', 'Obstáculo en la vía'
        OTRO = 'OTRO', 'Otro'

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        APROBADO = 'APROBADO', 'Aprobado'
        RECHAZADO = 'RECHAZADO', 'Rechazado'
        RESUELTO = 'RESUELTO', 'Resuelto'

    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='reportes')
    ruta = models.ForeignKey(
        'rutas.Ruta', on_delete=models.CASCADE, null=True, blank=True, related_name='reportes'
    )
    zona = models.ForeignKey(
        'ciudades.Zona', on_delete=models.CASCADE, null=True, blank=True, related_name='reportes'
    )
    tipo = models.CharField(max_length=12, choices=Tipo.choices)
    descripcion = models.TextField()
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PENDIENTE)
    observacion = models.CharField(max_length=255, blank=True, help_text='Comentario del administrador.')
    creado = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creado']
        verbose_name = 'reporte comunitario'
        verbose_name_plural = 'reportes comunitarios'

    def __str__(self):
        return f'{self.get_tipo_display()} ({self.get_estado_display()})'

    def clean(self):
        if not self.ruta_id and not self.zona_id:
            raise ValidationError({'ruta': 'Indique la ruta o la zona del reporte.'})


class Notificacion(models.Model):
    """RF-18: aviso dirigido a un usuario."""

    class Tipo(models.TextChoices):
        ALERTA = 'ALERTA', 'Alerta de seguridad'
        RETO = 'RETO', 'Reto'
        CLUB = 'CLUB', 'Club'
        EVENTO = 'EVENTO', 'Evento'
        SISTEMA = 'SISTEMA', 'Sistema'

    usuario = models.ForeignKey('usuarios.Usuario', on_delete=models.CASCADE, related_name='notificaciones')
    titulo = models.CharField(max_length=120)
    mensaje = models.TextField()
    tipo = models.CharField(max_length=8, choices=Tipo.choices, default=Tipo.SISTEMA)
    leida = models.BooleanField(default=False)
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creada']
        verbose_name = 'notificación'
        verbose_name_plural = 'notificaciones'

    def __str__(self):
        return f'{self.titulo} -> {self.usuario}'


class SolicitudCompanero(models.Model):
    """RF-22: invitación para correr juntos."""

    class Estado(models.TextChoices):
        PENDIENTE = 'PENDIENTE', 'Pendiente'
        ACEPTADA = 'ACEPTADA', 'Aceptada'
        RECHAZADA = 'RECHAZADA', 'Rechazada'

    solicitante = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.CASCADE, related_name='solicitudes_enviadas'
    )
    receptor = models.ForeignKey(
        'usuarios.Usuario', on_delete=models.CASCADE, related_name='solicitudes_recibidas'
    )
    mensaje = models.CharField(max_length=255, blank=True)
    estado = models.CharField(max_length=10, choices=Estado.choices, default=Estado.PENDIENTE)
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-creada']
        verbose_name = 'solicitud de compañero'
        verbose_name_plural = 'solicitudes de compañero'
        constraints = [
            models.UniqueConstraint(fields=['solicitante', 'receptor'], name='solicitud_companero_unica')
        ]

    def __str__(self):
        return f'{self.solicitante} -> {self.receptor} ({self.get_estado_display()})'

    def clean(self):
        if self.solicitante_id and self.solicitante_id == self.receptor_id:
            raise ValidationError({'receptor': 'No puede enviarse una solicitud a sí mismo.'})
