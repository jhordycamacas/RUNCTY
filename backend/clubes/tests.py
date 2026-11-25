from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin

from .models import Membresia, RutaClub, SalidaGrupal


class ClubApiTests(CrudApiMixin, APITestCase):
    prefijo = 'clubes'
    campo_invalido = 'fecha_fundacion'

    def crear_objeto(self):
        return f.club()

    def datos_validos(self):
        return {'nombre': f'Gacelas {f.n()}', 'ciudad': f.ciudad().pk, 'correo': 'club@gacelas.ec'}

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['fecha_fundacion'] = str(timezone.localdate() + timedelta(days=10))
        return datos

    def datos_parciales(self):
        return {'descripcion': 'Club de running de Loja'}


class MembresiaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'membresias'
    campo_invalido = 'estado'

    def crear_objeto(self):
        return Membresia.objects.create(club=f.club(), usuario=f.usuario())

    def datos_validos(self):
        return {'club': f.club().pk, 'usuario': f.usuario().pk, 'estado': 'PENDIENTE'}

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['estado'] = 'EXPULSADA'
        return datos

    def datos_parciales(self):
        return {'estado': 'ACTIVA'}

    def test_membresia_repetida_devuelve_400(self):
        membresia = self.crear_objeto()
        datos = {'club': membresia.club_id, 'usuario': membresia.usuario_id}
        respuesta = self.client.post('/api/membresias/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)


class RutaClubApiTests(CrudApiMixin, APITestCase):
    prefijo = 'rutas-club'
    campo_invalido = 'ruta'

    def crear_objeto(self):
        club = f.club()
        return RutaClub.objects.create(club=club, ruta=f.ruta(club.ciudad))

    def datos_validos(self):
        club = f.club()
        return {'club': club.pk, 'ruta': f.ruta(club.ciudad).pk, 'comentario': 'Ideal para principiantes'}

    def datos_invalidos(self):
        # La ruta es de otra ciudad.
        return {'club': f.club().pk, 'ruta': f.ruta().pk}

    def datos_parciales(self):
        return {'comentario': 'Mejor en la mañana'}


class PuntoEncuentroApiTests(CrudApiMixin, APITestCase):
    prefijo = 'puntos-encuentro'
    campo_invalido = 'longitud'

    def crear_objeto(self):
        return f.punto_encuentro()

    def datos_validos(self):
        return {'club': f.club().pk, 'nombre': 'Puerta de la Ciudad', 'latitud': -3.99, 'longitud': -79.2}

    def datos_invalidos(self):
        return {'club': f.club().pk, 'nombre': 'Lejos', 'latitud': -3.99, 'longitud': 500}

    def datos_parciales(self):
        return {'referencia': 'Junto a la pileta'}


class SalidaGrupalApiTests(CrudApiMixin, APITestCase):
    prefijo = 'salidas-grupales'
    campo_invalido = 'cupo'

    def crear_objeto(self):
        club = f.club()
        return SalidaGrupal.objects.create(
            club=club, ruta=f.ruta(club.ciudad), titulo='Salida del sábado', fecha_hora=f.manana(), cupo=20
        )

    def datos_validos(self):
        club = f.club()
        return {
            'club': club.pk, 'ruta': f.ruta(club.ciudad).pk, 'punto_encuentro': f.punto_encuentro(club).pk,
            'titulo': 'Fondo dominical', 'fecha_hora': f.manana().isoformat(), 'cupo': 15,
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['cupo'] = 0
        return datos

    def datos_parciales(self):
        return {'estado': 'REALIZADA'}

    def test_punto_de_encuentro_de_otro_club_devuelve_400(self):
        datos = self.datos_validos()
        datos['punto_encuentro'] = f.punto_encuentro().pk
        respuesta = self.client.post('/api/salidas-grupales/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('punto_encuentro', respuesta.data)
