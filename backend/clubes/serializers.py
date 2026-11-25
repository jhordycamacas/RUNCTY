from rest_framework import serializers

from config.validacion import ModeloValidadoSerializer

from .models import Club, Membresia, PuntoEncuentro, RutaClub, SalidaGrupal


class ClubSerializer(ModeloValidadoSerializer):
    ciudad_nombre = serializers.CharField(source='ciudad.nombre', read_only=True)
    total_miembros = serializers.IntegerField(source='membresias.count', read_only=True)

    class Meta:
        model = Club
        fields = [
            'id', 'nombre', 'ciudad', 'ciudad_nombre', 'representante', 'descripcion', 'correo',
            'fecha_fundacion', 'activo', 'total_miembros',
        ]


class MembresiaSerializer(ModeloValidadoSerializer):
    club_nombre = serializers.CharField(source='club.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.__str__', read_only=True)

    class Meta:
        model = Membresia
        fields = ['id', 'club', 'club_nombre', 'usuario', 'usuario_nombre', 'estado', 'fecha_solicitud']
        read_only_fields = ['fecha_solicitud']


class RutaClubSerializer(ModeloValidadoSerializer):
    club_nombre = serializers.CharField(source='club.nombre', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)

    class Meta:
        model = RutaClub
        fields = ['id', 'club', 'club_nombre', 'ruta', 'ruta_nombre', 'comentario', 'creada']
        read_only_fields = ['creada']


class PuntoEncuentroSerializer(ModeloValidadoSerializer):
    club_nombre = serializers.CharField(source='club.nombre', read_only=True)

    class Meta:
        model = PuntoEncuentro
        fields = ['id', 'club', 'club_nombre', 'nombre', 'referencia', 'latitud', 'longitud']


class SalidaGrupalSerializer(ModeloValidadoSerializer):
    club_nombre = serializers.CharField(source='club.nombre', read_only=True)
    ruta_nombre = serializers.CharField(source='ruta.nombre', read_only=True)

    class Meta:
        model = SalidaGrupal
        fields = [
            'id', 'club', 'club_nombre', 'ruta', 'ruta_nombre', 'punto_encuentro', 'titulo',
            'fecha_hora', 'cupo', 'estado',
        ]
