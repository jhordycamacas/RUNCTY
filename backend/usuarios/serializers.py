from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer

from .models import PerfilDeportivo, Preferencia, Rol, Usuario


class RolSerializer(ModeloValidadoSerializer):
    class Meta:
        model = Rol
        fields = ['id', 'nombre', 'descripcion', 'permisos']


class UsuarioSerializer(ModeloValidadoSerializer):
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)
    rol_nombre = serializers.CharField(source='rol.nombre', read_only=True)

    class Meta:
        model = Usuario
        fields = [
            'id', 'nombre', 'apellido', 'correo', 'fecha_nacimiento', 'ciudad', 'ciudad_nombre',
            'rol', 'rol_nombre', 'nivel', 'acepta_terminos', 'activo', 'creado',
        ]
        read_only_fields = ['creado']

    def validate_correo(self, valor):
        return valor.lower()


class PerfilDeportivoSerializer(ModeloValidadoSerializer):
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)

    class Meta:
        model = PerfilDeportivo
        fields = [
            'id', 'usuario', 'usuario_nombre', 'peso_kg', 'estatura_cm', 'objetivo',
            'km_semanales', 'ritmo_objetivo_min_km',
        ]


class PreferenciaSerializer(ModeloValidadoSerializer):
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)

    class Meta:
        model = Preferencia
        fields = [
            'id', 'usuario', 'usuario_nombre', 'notificaciones', 'tema', 'tamano_letra',
            'unidad_distancia', 'compartir_ubicacion',
        ]
