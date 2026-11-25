from django.contrib import admin

from .models import Club, Membresia, PuntoEncuentro, RutaClub, SalidaGrupal


class MembresiaInline(admin.TabularInline):
    model = Membresia
    extra = 0


class PuntoEncuentroInline(admin.TabularInline):
    model = PuntoEncuentro
    extra = 0


@admin.register(Club)
class ClubAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'ciudad', 'representante', 'activo')
    list_filter = ('ciudad', 'activo')
    search_fields = ('nombre', 'descripcion')
    inlines = [PuntoEncuentroInline, MembresiaInline]


@admin.register(Membresia)
class MembresiaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'club', 'estado', 'fecha_solicitud')
    list_filter = ('estado', 'club')
    search_fields = ('usuario__nombre', 'usuario__apellido', 'club__nombre')


@admin.register(RutaClub)
class RutaClubAdmin(admin.ModelAdmin):
    list_display = ('club', 'ruta', 'creada')
    list_filter = ('club',)
    search_fields = ('club__nombre', 'ruta__nombre')


@admin.register(PuntoEncuentro)
class PuntoEncuentroAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'club', 'referencia')
    list_filter = ('club',)
    search_fields = ('nombre', 'referencia')


@admin.register(SalidaGrupal)
class SalidaGrupalAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'club', 'ruta', 'fecha_hora', 'cupo', 'estado')
    list_filter = ('estado', 'club')
    search_fields = ('titulo',)
