from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer

from .models import Anunciante, Campana


class AnuncianteSerializer(ModeloValidadoSerializer):
    class Meta:
        model = Anunciante
        fields = ['id', 'nombre', 'ruc', 'correo', 'telefono', 'activo']


class CampanaSerializer(ModeloValidadoSerializer):
    anunciante_nombre = serializers.CharField(source='anunciante.nombre', read_only=True)
    vigente = serializers.BooleanField(read_only=True, help_text='Activa y dentro de las fechas.')

    class Meta:
        model = Campana
        fields = [
            'id', 'anunciante', 'anunciante_nombre', 'nombre', 'espacio', 'imagen_url', 'enlace',
            'fecha_inicio', 'fecha_fin', 'activa', 'vigente',
        ]
