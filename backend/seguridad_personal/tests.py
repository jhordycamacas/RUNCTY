from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin

from .models import AlertaPanico, UbicacionCompartida


class ContactoConfianzaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'contactos-confianza'
    campo_invalido = 'telefono'

    def crear_objeto(self):
        return f.contacto()

    def datos_validos(self):
        return {'usuario': f.usuario().pk, 'nombre': 'Carmen', 'telefono': '0991234567', 'parentesco': 'Madre'}

    def datos_invalidos(self):
        return {'usuario': f.usuario().pk, 'nombre': 'Carmen', 'telefono': 'abc'}

    def datos_parciales(self):
        return {'parentesco': 'Hermana'}


class AlertaPanicoApiTests(CrudApiMixin, APITestCase):
    prefijo = 'alertas-panico'
    campo_invalido = 'latitud'

    def crear_objeto(self):
        contacto = f.contacto()
        return AlertaPanico.objects.create(usuario=contacto.usuario, latitud=-3.99, longitud=-79.2)

    def datos_validos(self):
        return {'usuario': f.contacto().usuario_id, 'latitud': -3.99, 'longitud': -79.20}

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['latitud'] = -200
        return datos

    def datos_parciales(self):
        return {'estado': 'ATENDIDA'}

    def test_panico_sin_contactos_de_confianza_devuelve_400(self):
        datos = {'usuario': f.usuario().pk, 'latitud': -3.99, 'longitud': -79.20}
        respuesta = self.client.post('/api/alertas-panico/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('usuario', respuesta.data)

    def test_marcar_atendida_registra_la_hora(self):
        alerta = self.crear_objeto()
        respuesta = self.client.patch(f'/api/alertas-panico/{alerta.pk}/', {'estado': 'ATENDIDA'}, format='json')
        self.assertIsNotNone(respuesta.data['atendida_en'])

    def test_estado_desconocido_devuelve_400(self):
        alerta = self.crear_objeto()
        respuesta = self.client.patch(f'/api/alertas-panico/{alerta.pk}/', {'estado': 'PERDIDA'}, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)


class UbicacionCompartidaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'ubicaciones-compartidas'
    campo_invalido = 'contacto'

    def crear_objeto(self):
        contacto = f.contacto()
        return UbicacionCompartida.objects.create(
            usuario=contacto.usuario, contacto=contacto, latitud=-3.99, longitud=-79.2
        )

    def datos_validos(self):
        contacto = f.contacto()
        return {'usuario': contacto.usuario_id, 'contacto': contacto.pk, 'latitud': -3.99, 'longitud': -79.2}

    def datos_invalidos(self):
        # El contacto pertenece a otro usuario.
        return {'usuario': f.usuario().pk, 'contacto': f.contacto().pk, 'latitud': -3.99, 'longitud': -79.2}

    def datos_parciales(self):
        return {'activa': False}
