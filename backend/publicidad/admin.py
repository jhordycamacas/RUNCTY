from django.contrib import admin

from .models import Anunciante, Campana


class CampanaInline(admin.TabularInline):
    model = Campana
    extra = 0


@admin.register(Anunciante)
class AnuncianteAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ruc', 'correo', 'telefono', 'activo')
    list_filter = ('activo',)
    search_fields = ('nombre', 'ruc')
    inlines = [CampanaInline]


@admin.register(Campana)
class CampanaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'anunciante', 'espacio', 'fecha_inicio', 'fecha_fin', 'activa', 'vigente')
    list_filter = ('espacio', 'activa', 'anunciante')
    search_fields = ('nombre',)
