from datetime import date, timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin

from .models import Entrenamiento, MetaPersonal


class EntrenamientoApiTests(CrudApiMixin, APITestCase):
    prefijo = 'entrenamientos'
    campo_invalido = 'fecha_fin'

    def crear_objeto(self):
        inicio = timezone.now() - timedelta(hours=2)
        return Entrenamiento.objects.create(
            usuario=f.usuario(), fecha_inicio=inicio, fecha_fin=inicio + timedelta(minutes=30), distancia_km=5
        )

    def datos_validos(self):
        inicio = timezone.now() - timedelta(hours=3)
        return {
            'usuario': f.usuario().pk, 'ruta': f.ruta().pk, 'fecha_inicio': inicio.isoformat(),
            'fecha_fin': (inicio + timedelta(minutes=50)).isoformat(), 'distancia_km': 10,
            'puntos_gps': [{'lat': -3.99, 'lng': -79.2}, {'lat': -3.98, 'lng': -79.21}],
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['fecha_fin'] = (timezone.now() - timedelta(days=1)).isoformat()
        return datos

    def datos_parciales(self):
        return {'notas': 'Buen ritmo'}

    def test_calcula_el_ritmo_en_minutos_por_kilometro(self):
        respuesta = self.client.post('/api/entrenamientos/', self.datos_validos(), format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(respuesta.data['duracion_min'], 50.0)
        self.assertEqual(float(respuesta.data['ritmo_min_km']), 5.0)

    def test_puntos_gps_mal_formados_devuelven_400(self):
        datos = self.datos_validos()
        datos['puntos_gps'] = [{'lat': 'x'}]
        respuesta = self.client.post('/api/entrenamientos/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('puntos_gps', respuesta.data)


class MetaPersonalApiTests(CrudApiMixin, APITestCase):
    prefijo = 'metas'
    campo_invalido = 'valor_objetivo'

    def crear_objeto(self):
        return MetaPersonal.objects.create(
            usuario=f.usuario(), tipo='DISTANCIA', valor_objetivo=20,
            fecha_inicio=date.today(), fecha_fin=date.today() + timedelta(days=7),
        )

    def datos_validos(self):
        return {
            'usuario': f.usuario().pk, 'tipo': 'FRECUENCIA', 'valor_objetivo': 3, 'periodo': 'SEMANAL',
            'fecha_inicio': str(date.today()), 'fecha_fin': str(date.today() + timedelta(days=7)),
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['valor_objetivo'] = -5
        return datos

    def datos_parciales(self):
        return {'cumplida': True}

    def test_fecha_fin_anterior_devuelve_400(self):
        datos = self.datos_validos()
        datos['fecha_fin'] = str(date.today() - timedelta(days=1))
        respuesta = self.client.post('/api/metas/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('fecha_fin', respuesta.data)
