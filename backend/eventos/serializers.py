from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer

from .models import Evento, Inscripcion


class EventoSerializer(ModeloValidadoSerializer):
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)
    cupos_disponibles = serializers.IntegerField(read_only=True)

    class Meta:
        model = Evento
        fields = [
            'id', 'nombre', 'ciudad', 'ciudad_nombre', 'ruta', 'organizador', 'tipo', 'descripcion',
            'fecha_inicio', 'fecha_fin', 'distancia_km', 'cupo', 'cupos_disponibles', 'costo', 'estado',
        ]


class InscripcionSerializer(ModeloValidadoSerializer):
    evento_nombre = serializers.CharField(source='evento.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)

    class Meta:
        model = Inscripcion
        fields = [
            'id', 'evento', 'evento_nombre', 'usuario', 'usuario_nombre', 'categoria', 'estado', 'creada',
        ]
        read_only_fields = ['creada']
