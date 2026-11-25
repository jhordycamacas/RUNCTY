from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer

from .models import (
    Favorita, Notificacion, ReporteComunitario, Reto, SolicitudCompanero, Valoracion,
)


class FavoritaSerializer(ModeloValidadoSerializer):
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)

    class Meta:
        model = Favorita
        fields = ['id', 'usuario', 'ruta', 'ruta_nombre', 'creada']
        read_only_fields = ['creada']


class ValoracionSerializer(ModeloValidadoSerializer):
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)
    promedio = serializers.FloatField(read_only=True)

    class Meta:
        model = Valoracion
        fields = [
            'id', 'usuario', 'usuario_nombre', 'ruta', 'ruta_nombre', 'seguridad', 'iluminacion',
            'afluencia', 'promedio', 'comentario', 'creada',
        ]
        read_only_fields = ['creada']


class RetoSerializer(ModeloValidadoSerializer):
    creador_nombre = serializers.CharField(source='creador.__str__', read_only=True)
    retado_nombre = serializers.CharField(source='retado.__str__', read_only=True)

    class Meta:
        model = Reto
        fields = [
            'id', 'creador', 'creador_nombre', 'retado', 'retado_nombre', 'titulo', 'tipo',
            'valor_objetivo', 'fecha_inicio', 'fecha_fin', 'estado',
        ]


class ReporteComunitarioSerializer(ModeloValidadoSerializer):
    """La identidad del reportante queda reservada: se recibe pero no se devuelve."""

    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True, default=None)
    zona_nombre = serializers.CharField(source='zona.nombre', read_only=True, default=None)

    class Meta:
        model = ReporteComunitario
        fields = [
            'id', 'usuario', 'ruta', 'ruta_nombre', 'zona', 'zona_nombre', 'tipo', 'descripcion',
            'estado', 'observacion', 'creado',
        ]
        read_only_fields = ['creado']
        extra_kwargs = {'usuario': {'write_only': True}}


class NotificacionSerializer(ModeloValidadoSerializer):
    class Meta:
        model = Notificacion
        fields = ['id', 'usuario', 'titulo', 'mensaje', 'tipo', 'leida', 'creada']
        read_only_fields = ['creada']


class SolicitudCompaneroSerializer(ModeloValidadoSerializer):
    solicitante_nombre = serializers.CharField(source='solicitante.__str__', read_only=True)
    receptor_nombre = serializers.CharField(source='receptor.__str__', read_only=True)

    class Meta:
        model = SolicitudCompanero
        fields = [
            'id', 'solicitante', 'solicitante_nombre', 'receptor', 'receptor_nombre', 'mensaje',
            'estado', 'creada',
        ]
        read_only_fields = ['creada']
