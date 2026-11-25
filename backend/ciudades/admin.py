from django.contrib import admin

from .models import Ciudad, Zona


class ZonaInline(admin.TabularInline):
    model = Zona
    extra = 0


@admin.register(Ciudad)
class CiudadAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'provincia', 'pais', 'activa')
    list_filter = ('activa', 'provincia')
    search_fields = ('nombre', 'provincia')
    inlines = [ZonaInline]


@admin.register(Zona)
class ZonaAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ciudad', 'tipo')
    list_filter = ('tipo', 'ciudad')
    search_fields = ('nombre',)
