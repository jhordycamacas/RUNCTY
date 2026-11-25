from django.contrib import admin

from .models import AlertaPanico, ContactoConfianza, UbicacionCompartida


@admin.register(ContactoConfianza)
class ContactoConfianzaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'telefono', 'parentesco', 'usuario')
    list_filter = ('parentesco',)
    search_fields = ('nombre', 'telefono', 'usuario__nombre', 'usuario__apellido')


@admin.register(AlertaPanico)
class AlertaPanicoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'estado', 'creada', 'atendida_en')
    list_filter = ('estado',)
    search_fields = ('usuario__nombre', 'usuario__apellido', 'mensaje')
    readonly_fields = ('atendida_en',)


@admin.register(UbicacionCompartida)
class UbicacionCompartidaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'contacto', 'activa', 'inicio', 'fin')
    list_filter = ('activa',)
    search_fields = ('usuario__nombre', 'usuario__apellido', 'contacto__nombre')
