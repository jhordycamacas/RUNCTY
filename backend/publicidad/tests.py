from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin

from .models import Campana


class AnuncianteApiTests(CrudApiMixin, APITestCase):
    prefijo = 'anunciantes'
    campo_invalido = 'ruc'

    def crear_objeto(self):
        return f.anunciante()

    def datos_validos(self):
        return {'nombre': f'Deportes Loja {f.n()}', 'ruc': f'{f.n():013d}', 'correo': 'info@deportes.ec'}

    def datos_invalidos(self):
        return {'nombre': 'Sin RUC', 'ruc': '123', 'correo': 'info@deportes.ec'}

    def datos_parciales(self):
        return {'activo': False}


class CampanaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'campanas'
    campo_invalido = 'fecha_fin'

    def crear_objeto(self):
        hoy = timezone.localdate()
        return Campana.objects.create(
            anunciante=f.anunciante(), nombre='Zapatillas', fecha_inicio=hoy, fecha_fin=hoy + timedelta(days=30)
        )

    def datos_validos(self):
        hoy = timezone.localdate()
        return {
            'anunciante': f.anunciante().pk, 'nombre': 'Hidratación', 'espacio': 'RUTAS',
            'fecha_inicio': str(hoy), 'fecha_fin': str(hoy),
        }

    def datos_invalidos(self):
        hoy = timezone.localdate()
        return {
            'anunciante': f.anunciante().pk, 'nombre': 'Al revés', 'fecha_inicio': str(hoy),
            'fecha_fin': str(hoy - timedelta(days=1)),
        }

    def datos_parciales(self):
        return {'activa': False}

    def test_campana_vigente_solo_dentro_de_las_fechas(self):
        vigente = self.crear_objeto()
        hoy = timezone.localdate()
        vencida = Campana.objects.create(
            anunciante=f.anunciante(), nombre='Vieja', fecha_inicio=hoy - timedelta(days=60),
            fecha_fin=hoy - timedelta(days=30),
        )
        self.assertTrue(self.client.get(f'/api/campanas/{vigente.pk}/').data['vigente'])
        self.assertFalse(self.client.get(f'/api/campanas/{vencida.pk}/').data['vigente'])

    def test_espacio_no_definido_devuelve_400(self):
        datos = self.datos_validos()
        datos['espacio'] = 'BOTON_PANICO'
        respuesta = self.client.post('/api/campanas/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('espacio', respuesta.data)
