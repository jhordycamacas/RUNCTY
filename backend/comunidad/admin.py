from django.contrib import admin

from .models import (
    Favorita, Notificacion, ReporteComunitario, Reto, SolicitudCompanero, Valoracion,
)


@admin.register(Favorita)
class FavoritaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'ruta', 'creada')
    list_filter = ('ruta',)
    search_fields = ('usuario__nombre', 'usuario__apellido', 'ruta__nombre')


@admin.register(Valoracion)
class ValoracionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'ruta', 'seguridad', 'iluminacion', 'afluencia', 'creada')
    list_filter = ('ruta', 'seguridad')
    search_fields = ('usuario__nombre', 'ruta__nombre', 'comentario')


@admin.register(Reto)
class RetoAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'creador', 'retado', 'tipo', 'estado', 'fecha_inicio', 'fecha_fin')
    list_filter = ('estado', 'tipo')
    search_fields = ('titulo',)


@admin.register(ReporteComunitario)
class ReporteComunitarioAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'ruta', 'zona', 'estado', 'creado')
    list_filter = ('estado', 'tipo')
    search_fields = ('descripcion',)


@admin.register(Notificacion)
class NotificacionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'usuario', 'tipo', 'leida', 'creada')
    list_filter = ('tipo', 'leida')
    search_fields = ('titulo', 'mensaje')


@admin.register(SolicitudCompanero)
class SolicitudCompaneroAdmin(admin.ModelAdmin):
    list_display = ('solicitante', 'receptor', 'estado', 'creada')
    list_filter = ('estado',)
    search_fields = ('solicitante__nombre', 'receptor__nombre')
