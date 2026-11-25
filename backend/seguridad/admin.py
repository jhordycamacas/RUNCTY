from django.contrib import admin

from .models import (
    AlertaZona, FactorRiesgo, FranjaHoraria, FuenteInformacion, Incidente, SolicitudRutaSegura,
)


@admin.register(FranjaHoraria)
class FranjaHorariaAdmin(admin.ModelAdmin):
    list_display = ('ruta', 'nombre', 'hora_inicio', 'hora_fin')
    list_filter = ('ruta',)
    search_fields = ('nombre', 'ruta__nombre')


@admin.register(FactorRiesgo)
class FactorRiesgoAdmin(admin.ModelAdmin):
    list_display = ('tramo', 'franja', 'tipo', 'severidad', 'activo')
    list_filter = ('severidad', 'tipo', 'activo')
    search_fields = ('descripcion', 'tramo__nombre', 'tramo__ruta__nombre')


@admin.register(AlertaZona)
class AlertaZonaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'zona', 'nivel', 'fecha_inicio', 'fecha_fin', 'activa')
    list_filter = ('nivel', 'activa', 'zona__ciudad')
    search_fields = ('titulo', 'descripcion')


@admin.register(FuenteInformacion)
class FuenteInformacionAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'confiabilidad', 'contacto')
    list_filter = ('tipo',)
    search_fields = ('nombre',)


@admin.register(Incidente)
class IncidenteAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'zona', 'ruta', 'fuente', 'fecha')
    list_filter = ('tipo', 'zona__ciudad', 'fuente')
    search_fields = ('descripcion',)


@admin.register(SolicitudRutaSegura)
class SolicitudRutaSeguraAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'ciudad', 'hora', 'distancia_max_km', 'creada')
    list_filter = ('ciudad',)
    search_fields = ('usuario__nombre', 'usuario__apellido')
