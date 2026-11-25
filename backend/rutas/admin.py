from django.contrib import admin

from seguridad.models import FranjaHoraria

from .models import PuntoApoyo, Ruta, SenderoResguardado, Tramo


class TramoInline(admin.TabularInline):
    model = Tramo
    extra = 0


class FranjaHorariaInline(admin.TabularInline):
    model = FranjaHoraria
    extra = 0


@admin.register(Ruta)
class RutaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ciudad', 'distancia_km', 'dificultad', 'superficie', 'activa')
    list_filter = ('ciudad', 'dificultad', 'superficie', 'activa')
    search_fields = ('nombre', 'descripcion')
    inlines = [TramoInline, FranjaHorariaInline]


@admin.register(Tramo)
class TramoAdmin(admin.ModelAdmin):
    list_display = ('ruta', 'orden', 'nombre', 'distancia_km', 'zona')
    list_filter = ('ruta',)
    search_fields = ('nombre', 'ruta__nombre')


@admin.register(PuntoApoyo)
class PuntoApoyoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'tipo', 'ruta', 'horario')
    list_filter = ('tipo', 'ruta')
    search_fields = ('nombre',)


@admin.register(SenderoResguardado)
class SenderoResguardadoAdmin(admin.ModelAdmin):
    list_display = ('ruta', 'institucion', 'dias', 'hora_inicio', 'hora_fin', 'activo')
    list_filter = ('activo', 'ruta')
    search_fields = ('ruta__nombre', 'institucion')
