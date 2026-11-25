from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin
from seguridad.models import FactorRiesgo

from .models import PuntoApoyo, SenderoResguardado


class RutaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'rutas'
    campo_invalido = 'distancia_km'

    def crear_objeto(self):
        return f.ruta()

    def datos_validos(self):
        return {
            'ciudad': f.ciudad().pk, 'nombre': 'Parque Jipiro', 'distancia_km': 4.5,
            'dificultad': 'FACIL', 'superficie': 'ASFALTO',
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['distancia_km'] = 0
        return datos

    def datos_parciales(self):
        return {'activa': False}

    def test_ruta_expone_indice_de_seguridad_por_franja(self):
        ruta = f.ruta()
        tramo_1, tramo_2 = f.tramo(ruta), f.tramo(ruta)
        madrugada = f.franja(ruta)
        tarde = f.franja(ruta, inicio=f.time(18, 0), fin=f.time(20, 0), nombre='Tarde')
        FactorRiesgo.objects.create(tramo=tramo_1, franja=madrugada, tipo='ILUMINACION', severidad='ALTA')
        FactorRiesgo.objects.create(tramo=tramo_2, franja=madrugada, tipo='SOLEDAD', severidad='BAJA')

        respuesta = self.client.get(f'/api/rutas/{ruta.pk}/')

        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        por_franja = {e['franja']: e for e in respuesta.data['seguridad']}
        self.assertEqual(por_franja[madrugada.pk]['puntaje'], 65)  # peor tramo: 100 - 35
        self.assertEqual(por_franja[madrugada.pk]['nivel'], 'Medio')
        self.assertEqual(por_franja[tarde.pk]['puntaje'], 100)
        self.assertEqual(respuesta.data['nivel_seguridad'], 'Medio')

    def test_el_indice_no_lo_puede_enviar_el_cliente(self):
        ruta = f.ruta()
        respuesta = self.client.patch(
            f'/api/rutas/{ruta.pk}/', {'nivel_seguridad': 'Alto', 'seguridad': []}, format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertIsNone(respuesta.data['nivel_seguridad'])


class TramoApiTests(CrudApiMixin, APITestCase):
    prefijo = 'tramos'
    campo_invalido = 'orden'

    def crear_objeto(self):
        return f.tramo()

    def datos_validos(self):
        return {'ruta': f.ruta().pk, 'orden': 1, 'nombre': 'Subida al mirador', 'distancia_km': 1.2}

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['orden'] = 0
        return datos

    def datos_parciales(self):
        return {'nombre': 'Bajada'}

    def test_zona_de_otra_ciudad_devuelve_400(self):
        datos = self.datos_validos()
        datos['zona'] = f.zona().pk
        respuesta = self.client.post('/api/tramos/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('zona', respuesta.data)


class PuntoApoyoApiTests(CrudApiMixin, APITestCase):
    prefijo = 'puntos-apoyo'
    campo_invalido = 'latitud'

    def crear_objeto(self):
        return PuntoApoyo.objects.create(
            ruta=f.ruta(), nombre='UPC Jipiro', tipo='PUESTO_POLICIAL', latitud=-3.97, longitud=-79.2
        )

    def datos_validos(self):
        return {
            'ruta': f.ruta().pk, 'nombre': 'Farmacia 24 h', 'tipo': 'COMERCIO_ABIERTO',
            'latitud': -3.99, 'longitud': -79.20,
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['latitud'] = 120
        return datos

    def datos_parciales(self):
        return {'horario': '24 horas'}


class SenderoResguardadoApiTests(CrudApiMixin, APITestCase):
    prefijo = 'senderos-resguardados'
    campo_invalido = 'hora_fin'

    def crear_objeto(self):
        return SenderoResguardado.objects.create(
            ruta=f.ruta(), dias='Lunes a viernes', hora_inicio=f.time(5, 0), hora_fin=f.time(7, 0)
        )

    def datos_validos(self):
        return {'ruta': f.ruta().pk, 'dias': 'Sábados', 'hora_inicio': '06:00', 'hora_fin': '08:00'}

    def datos_invalidos(self):
        return {'ruta': f.ruta().pk, 'dias': 'Sábados', 'hora_inicio': '08:00', 'hora_fin': '06:00'}

    def datos_parciales(self):
        return {'activo': False}
