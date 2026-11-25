from django.contrib import admin

from .models import Evento, Inscripcion


class InscripcionInline(admin.TabularInline):
    model = Inscripcion
    extra = 0


@admin.register(Evento)
class EventoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ciudad', 'tipo', 'fecha_inicio', 'cupo', 'cupos_disponibles', 'estado')
    list_filter = ('tipo', 'estado', 'ciudad')
    search_fields = ('nombre', 'organizador')
    inlines = [InscripcionInline]


@admin.register(Inscripcion)
class InscripcionAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'evento', 'categoria', 'estado', 'creada')
    list_filter = ('estado', 'evento')
    search_fields = ('usuario__nombre', 'usuario__apellido', 'evento__nombre')
