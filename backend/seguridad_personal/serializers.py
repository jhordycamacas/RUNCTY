from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer

from .models import AlertaPanico, ContactoConfianza, UbicacionCompartida


class ContactoConfianzaSerializer(ModeloValidadoSerializer):
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)

    class Meta:
        model = ContactoConfianza
        fields = ['id', 'usuario', 'usuario_nombre', 'nombre', 'telefono', 'correo', 'parentesco']


class AlertaPanicoSerializer(ModeloValidadoSerializer):
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)
    contactos_notificados = serializers.IntegerField(source='usuario.contactos.count', read_only=True)

    class Meta:
        model = AlertaPanico
        fields = [
            'id', 'usuario', 'usuario_nombre', 'latitud', 'longitud', 'mensaje', 'estado',
            'contactos_notificados', 'creada', 'atendida_en',
        ]
        read_only_fields = ['creada', 'atendida_en']


class UbicacionCompartidaSerializer(ModeloValidadoSerializer):
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)
    contacto_nombre = serializers.CharField(source='contacto.nombre', read_only=True)

    class Meta:
        model = UbicacionCompartida
        fields = [
            'id', 'usuario', 'usuario_nombre', 'contacto', 'contacto_nombre', 'latitud', 'longitud',
            'inicio', 'fin', 'activa',
        ]
        read_only_fields = ['inicio']
