from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer

from .models import Ciudad, Zona


class CiudadSerializer(ModeloValidadoSerializer):
    total_zonas = serializers.IntegerField(source='zonas.count', read_only=True)

    class Meta:
        model = Ciudad
        fields = ['id', 'nombre', 'provincia', 'pais', 'activa', 'total_zonas', 'creada']
        read_only_fields = ['creada']


class ZonaSerializer(ModeloValidadoSerializer):
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)

    class Meta:
        model = Zona
        fields = ['id', 'ciudad', 'ciudad_nombre', 'nombre', 'tipo', 'descripcion']
