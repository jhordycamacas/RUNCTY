from django.contrib import admin

from .models import Entrenamiento, MetaPersonal


@admin.register(Entrenamiento)
class EntrenamientoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'ruta', 'fecha_inicio', 'distancia_km', 'duracion_min', 'ritmo_min_km')
    list_filter = ('ruta',)
    search_fields = ('usuario__nombre', 'usuario__apellido', 'notas')


@admin.register(MetaPersonal)
class MetaPersonalAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'tipo', 'valor_objetivo', 'periodo', 'fecha_inicio', 'fecha_fin', 'cumplida')
    list_filter = ('tipo', 'periodo', 'cumplida')
    search_fields = ('usuario__nombre', 'usuario__apellido')
