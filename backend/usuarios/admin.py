from django.contrib import admin

from .models import PerfilDeportivo, Preferencia, Rol, Usuario


class PerfilDeportivoInline(admin.StackedInline):
    model = PerfilDeportivo
    extra = 0


class PreferenciaInline(admin.StackedInline):
    model = Preferencia
    extra = 0


@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'descripcion')
    search_fields = ('nombre',)


@admin.register(Usuario)
class UsuarioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'apellido', 'correo', 'ciudad', 'rol', 'nivel', 'activo')
    list_filter = ('rol', 'nivel', 'activo', 'ciudad')
    search_fields = ('nombre', 'apellido', 'correo')
    inlines = [PerfilDeportivoInline, PreferenciaInline]


@admin.register(PerfilDeportivo)
class PerfilDeportivoAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'objetivo', 'peso_kg', 'estatura_cm', 'km_semanales')
    list_filter = ('objetivo',)
    search_fields = ('usuario__nombre', 'usuario__apellido')


@admin.register(Preferencia)
class PreferenciaAdmin(admin.ModelAdmin):
    list_display = ('usuario', 'notificaciones', 'tema', 'tamano_letra', 'unidad_distancia')
    list_filter = ('tema', 'notificaciones')
    search_fields = ('usuario__nombre', 'usuario__apellido')
