from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer
from seguridad.indice import evaluar_ruta

from .models import PuntoApoyo, Ruta, SenderoResguardado, Tramo


class RutaSerializer(ModeloValidadoSerializer):
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)
    seguridad = serializers.SerializerMethodField(
        help_text='Índice de seguridad por franja horaria (calculado por el servidor).'
    )
    nivel_seguridad = serializers.SerializerMethodField(
        help_text='Peor nivel entre las franjas: Alto, Medio o Bajo (null si no hay franjas).'
    )

    class Meta:
        model = Ruta
        fields = [
            'id', 'ciudad', 'ciudad_nombre', 'nombre', 'descripcion', 'distancia_km', 'dificultad',
            'superficie', 'activa', 'seguridad', 'nivel_seguridad', 'creada',
        ]
        read_only_fields = ['creada']

    def _evaluacion(self, ruta):
        # Se calcula una sola vez por ruta y se reutiliza en ambos campos.
        cache = self.context.setdefault('_evaluaciones', {})
        if ruta.pk not in cache:
            cache[ruta.pk] = evaluar_ruta(ruta)
        return cache[ruta.pk]

    @extend_schema_field(serializers.ListField(child=serializers.DictField()))
    def get_seguridad(self, ruta):
        return self._evaluacion(ruta)

    @extend_schema_field(serializers.CharField(allow_null=True))
    def get_nivel_seguridad(self, ruta):
        evaluaciones = self._evaluacion(ruta)
        if not evaluaciones:
            return None
        return min(evaluaciones, key=lambda e: e['puntaje'])['nivel']


class TramoSerializer(ModeloValidadoSerializer):
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)
    zona_nombre = serializers.CharField(source='zona.nombre', read_only=True, default=None)

    class Meta:
        model = Tramo
        fields = ['id', 'ruta', 'ruta_nombre', 'orden', 'nombre', 'distancia_km', 'zona', 'zona_nombre']


class PuntoApoyoSerializer(ModeloValidadoSerializer):
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)

    class Meta:
        model = PuntoApoyo
        fields = ['id', 'ruta', 'ruta_nombre', 'nombre', 'tipo', 'latitud', 'longitud', 'horario']


class SenderoResguardadoSerializer(ModeloValidadoSerializer):
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)

    class Meta:
        model = SenderoResguardado
        fields = ['id', 'ruta', 'ruta_nombre', 'institucion', 'dias', 'hora_inicio', 'hora_fin', 'activo']
