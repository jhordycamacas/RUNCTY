from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer

from .models import Entrenamiento, MetaPersonal


class EntrenamientoSerializer(ModeloValidadoSerializer):
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True, default=None)
    duracion_min = serializers.FloatField(read_only=True, help_text='Calculada con las fechas.')
    ritmo_min_km = serializers.DecimalField(
        max_digits=6, decimal_places=2, read_only=True, help_text='Minutos por kilómetro (calculado).'
    )

    class Meta:
        model = Entrenamiento
        fields = [
            'id', 'usuario', 'usuario_nombre', 'ruta', 'ruta_nombre', 'fecha_inicio', 'fecha_fin',
            'distancia_km', 'duracion_min', 'ritmo_min_km', 'calorias', 'puntos_gps', 'notas',
        ]


class MetaPersonalSerializer(ModeloValidadoSerializer):
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)

    class Meta:
        model = MetaPersonal
        fields = [
            'id', 'usuario', 'usuario_nombre', 'tipo', 'valor_objetivo', 'periodo', 'fecha_inicio',
            'fecha_fin', 'cumplida',
        ]
