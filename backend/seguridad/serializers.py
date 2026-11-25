from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer
from rutas.models import Ruta

from .indice import recomendar_rutas
from .models import (
    AlertaZona, FactorRiesgo, FranjaHoraria, FuenteInformacion, Incidente, SolicitudRutaSegura,
)


class FranjaHorariaSerializer(ModeloValidadoSerializer):
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)

    class Meta:
        model = FranjaHoraria
        fields = ['id', 'ruta', 'ruta_nombre', 'nombre', 'hora_inicio', 'hora_fin']


class FactorRiesgoSerializer(ModeloValidadoSerializer):
    tramo_nombre = serializers.CharField(source='tramo.__str__', read_only=True)
    franja_nombre = serializers.CharField(source='franja.__str__', read_only=True)

    class Meta:
        model = FactorRiesgo
        fields = [
            'id', 'tramo', 'tramo_nombre', 'franja', 'franja_nombre', 'tipo', 'severidad',
            'descripcion', 'activo',
        ]


class AlertaZonaSerializer(ModeloValidadoSerializer):
    zona_nombre = serializers.CharField(source='zona.nombre', read_only=True)

    class Meta:
        model = AlertaZona
        fields = [
            'id', 'zona', 'zona_nombre', 'titulo', 'descripcion', 'nivel', 'fecha_inicio',
            'fecha_fin', 'activa',
        ]


class FuenteInformacionSerializer(ModeloValidadoSerializer):
    class Meta:
        model = FuenteInformacion
        fields = ['id', 'nombre', 'tipo', 'confiabilidad', 'contacto']


class IncidenteSerializer(ModeloValidadoSerializer):
    zona_nombre = serializers.CharField(source='zona.nombre', read_only=True)

    class Meta:
        model = Incidente
        fields = [
            'id', 'zona', 'zona_nombre', 'ruta', 'fuente', 'tipo', 'descripcion', 'fecha',
            'latitud', 'longitud',
        ]


class RutaRecomendadaSerializer(serializers.Serializer):
    """Forma de cada ruta recomendada (solo para la documentación)."""

    ruta = serializers.IntegerField()
    nombre = serializers.CharField()
    distancia_km = serializers.DecimalField(max_digits=5, decimal_places=2)
    franja = serializers.IntegerField()
    franja_nombre = serializers.CharField()
    hora_inicio = serializers.CharField()
    hora_fin = serializers.CharField()
    puntaje = serializers.IntegerField()
    nivel = serializers.CharField()
    tramo_critico = serializers.CharField(allow_null=True)
    factores = serializers.ListField(child=serializers.CharField())


class SolicitudRutaSeguraSerializer(ModeloValidadoSerializer):
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)
    rutas_recomendadas = serializers.SerializerMethodField(
        help_text='Rutas activas de la ciudad con franja en esa hora, de la más segura a la menos segura.'
    )

    class Meta:
        model = SolicitudRutaSegura
        fields = [
            'id', 'usuario', 'ciudad', 'ciudad_nombre', 'hora', 'distancia_max_km', 'creada',
            'rutas_recomendadas',
        ]
        read_only_fields = ['creada']

    @extend_schema_field(RutaRecomendadaSerializer(many=True))
    def get_rutas_recomendadas(self, solicitud):
        rutas = Ruta.objects.filter(ciudad=solicitud.ciudad, activa=True).prefetch_related(
            'franjas', 'tramos__factores'
        )
        return RutaRecomendadaSerializer(
            recomendar_rutas(rutas, solicitud.hora, solicitud.distancia_max_km), many=True
        ).data
