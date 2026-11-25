from datetime import timedelta

from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin

from .models import Inscripcion


class EventoApiTests(CrudApiMixin, APITestCase):
    prefijo = 'eventos'
    campo_invalido = 'fecha_fin'

    def crear_objeto(self):
        return f.evento()

    def datos_validos(self):
        inicio = timezone.now() + timedelta(days=20)
        return {
            'nombre': '10K Ciudad de Loja', 'ciudad': f.ciudad().pk, 'organizador': 'Municipio',
            'tipo': 'CARRERA', 'fecha_inicio': inicio.isoformat(),
            'fecha_fin': (inicio + timedelta(hours=2)).isoformat(), 'distancia_km': 10, 'cupo': 300,
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['fecha_fin'] = datos['fecha_inicio']
        return datos

    def datos_parciales(self):
        return {'estado': 'CERRADO'}

    def test_cupo_cero_devuelve_400(self):
        datos = self.datos_validos()
        datos['cupo'] = 0
        respuesta = self.client.post('/api/eventos/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cupo', respuesta.data)


class InscripcionApiTests(CrudApiMixin, APITestCase):
    prefijo = 'inscripciones'
    campo_invalido = 'evento'

    def crear_objeto(self):
        return Inscripcion.objects.create(evento=f.evento(), usuario=f.usuario(), categoria='10K')

    def datos_validos(self):
        return {'evento': f.evento().pk, 'usuario': f.usuario().pk, 'categoria': '5K'}

    def datos_invalidos(self):
        return {'evento': f.evento(estado='CERRADO').pk, 'usuario': f.usuario().pk}

    def datos_parciales(self):
        return {'categoria': 'Máster'}

    def test_evento_sin_cupos_devuelve_400(self):
        evento = f.evento(cupo=1)
        Inscripcion.objects.create(evento=evento, usuario=f.usuario())
        respuesta = self.client.post(
            '/api/inscripciones/', {'evento': evento.pk, 'usuario': f.usuario().pk}, format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('evento', respuesta.data)
        detalle = self.client.get(f'/api/eventos/{evento.pk}/')
        self.assertEqual(detalle.data['cupos_disponibles'], 0)
