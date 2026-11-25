from io import StringIO

from django.core.management import call_command
from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin
from rutas.models import Ruta


class CiudadApiTests(CrudApiMixin, APITestCase):
    prefijo = 'ciudades'
    campo_invalido = 'nombre'

    def crear_objeto(self):
        return f.ciudad()

    def datos_validos(self):
        return {'nombre': f'Cuenca {f.n()}', 'provincia': 'Azuay'}

    def datos_invalidos(self):
        return {'nombre': '', 'provincia': 'Azuay'}

    def datos_parciales(self):
        return {'activa': False}

    def test_nombre_repetido_devuelve_400(self):
        f.ciudad(nombre='Loja')
        respuesta = self.client.post('/api/ciudades/', {'nombre': 'Loja', 'provincia': 'Loja'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)

    def test_eliminar_ciudad_con_usuarios_devuelve_409(self):
        usuario = f.usuario()
        respuesta = self.client.delete(f'/api/ciudades/{usuario.ciudad_id}/')
        self.assertEqual(respuesta.status_code, status.HTTP_409_CONFLICT)


class DocumentacionApiTests(APITestCase):
    def test_swagger_y_esquema_responden_200(self):
        self.assertEqual(self.client.get('/api/docs/').status_code, status.HTTP_200_OK)
        self.assertEqual(self.client.get('/api/schema/').status_code, status.HTTP_200_OK)


class SeedTests(APITestCase):
    def test_seed_carga_loja_y_es_idempotente(self):
        call_command('seed', stdout=StringIO())
        primera = (Ruta.objects.count(), self.client.get('/api/franjas-horarias/').data['count'])
        call_command('seed', stdout=StringIO())
        segunda = (Ruta.objects.count(), self.client.get('/api/franjas-horarias/').data['count'])
        self.assertEqual(primera, (5, 10))
        self.assertEqual(primera, segunda)
        niveles = {r['nombre']: r['nivel_seguridad'] for r in self.client.get('/api/rutas/').data['results']}
        self.assertEqual(niveles['Parque Recreacional Jipiro'], 'Alto')
        self.assertEqual(niveles['Malecón del río Zamora'], 'Medio')  # 100 - 35 - 20 = 45
        self.assertEqual(niveles['Subida a Zamora Huayco'], 'Medio')  # 100 - 35 - 20 = 45


class ZonaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'zonas'
    campo_invalido = 'ciudad'

    def crear_objeto(self):
        return f.zona()

    def datos_validos(self):
        return {'ciudad': f.ciudad().pk, 'nombre': 'Zamora Huayco', 'tipo': 'URBANA'}

    def datos_invalidos(self):
        return {'ciudad': 999999, 'nombre': 'Sin ciudad'}

    def datos_parciales(self):
        return {'tipo': 'PARQUE'}

    def test_filtrar_por_ciudad(self):
        zona = f.zona()
        f.zona()
        respuesta = self.client.get(f'/api/zonas/?ciudad={zona.ciudad_id}')
        self.assertEqual(respuesta.data['count'], 1)
