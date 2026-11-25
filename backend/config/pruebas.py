"""Ayudas compartidas por las pruebas: fábricas de datos y pruebas CRUD comunes."""
import itertools
from datetime import date, datetime, time, timedelta

from django.utils import timezone
from rest_framework import status

from ciudades.models import Ciudad, Zona
from clubes.models import Club, PuntoEncuentro
from eventos.models import Evento
from publicidad.models import Anunciante
from rutas.models import Ruta, Tramo
from seguridad.models import FranjaHoraria, FuenteInformacion
from seguridad_personal.models import ContactoConfianza
from usuarios.models import Rol, Usuario

_contador = itertools.count(1)


def n():
    """Número único para nombres que no se pueden repetir."""
    return next(_contador)


def ayer():
    return timezone.now() - timedelta(days=1)


def manana():
    return timezone.now() + timedelta(days=1)


def ciudad(**extra):
    return Ciudad.objects.create(**{'nombre': f'Ciudad {n()}', 'provincia': 'Loja', **extra})


def zona(ciudad_=None, **extra):
    return Zona.objects.create(**{'ciudad': ciudad_ or ciudad(), 'nombre': f'Zona {n()}', **extra})


def rol(**extra):
    return Rol.objects.create(**{'nombre': f'Rol {n()}', **extra})


def usuario(ciudad_=None, **extra):
    datos = {
        'nombre': 'Ana', 'apellido': 'Pérez', 'correo': f'corredor{n()}@runcty.ec',
        'fecha_nacimiento': date(1998, 5, 10), 'ciudad': ciudad_ or ciudad(), 'rol': rol(),
        **extra,
    }
    return Usuario.objects.create(**datos)


def ruta(ciudad_=None, **extra):
    datos = {'ciudad': ciudad_ or ciudad(), 'nombre': f'Ruta {n()}', 'distancia_km': 5, **extra}
    return Ruta.objects.create(**datos)


def tramo(ruta_=None, **extra):
    ruta_ = ruta_ or ruta()
    orden = ruta_.tramos.count() + 1
    return Tramo.objects.create(
        **{'ruta': ruta_, 'orden': orden, 'nombre': f'Tramo {orden}', 'distancia_km': 1, **extra}
    )


def franja(ruta_=None, inicio=time(5, 0), fin=time(7, 0), **extra):
    return FranjaHoraria.objects.create(
        **{'ruta': ruta_ or ruta(), 'nombre': 'Madrugada', 'hora_inicio': inicio, 'hora_fin': fin, **extra}
    )


def fuente(**extra):
    return FuenteInformacion.objects.create(**{'nombre': f'Fuente {n()}', 'tipo': 'POLICIA', **extra})


def contacto(usuario_=None, **extra):
    return ContactoConfianza.objects.create(
        **{'usuario': usuario_ or usuario(), 'nombre': 'María', 'telefono': f'09{n():08d}', **extra}
    )


def club(ciudad_=None, **extra):
    return Club.objects.create(**{'nombre': f'Club {n()}', 'ciudad': ciudad_ or ciudad(), **extra})


def punto_encuentro(club_=None, **extra):
    return PuntoEncuentro.objects.create(
        **{'club': club_ or club(), 'nombre': 'Parque central', 'latitud': -3.99, 'longitud': -79.2, **extra}
    )


def evento(ciudad_=None, **extra):
    inicio = timezone.now() + timedelta(days=30)
    datos = {
        'nombre': f'Carrera {n()}', 'ciudad': ciudad_ or ciudad(), 'organizador': 'Gacelas',
        'fecha_inicio': inicio, 'fecha_fin': inicio + timedelta(hours=3), 'distancia_km': 10, 'cupo': 100,
        **extra,
    }
    return Evento.objects.create(**datos)


def anunciante(**extra):
    return Anunciante.objects.create(
        **{'nombre': f'Anunciante {n()}', 'ruc': f'{n():013d}', 'correo': 'ventas@empresa.ec', **extra}
    )


def iso(valor):
    """Fecha u hora en el formato que espera la API."""
    if isinstance(valor, (datetime, date, time)):
        return valor.isoformat()
    return valor


class CrudApiMixin:
    """Pruebas CRUD comunes. Cada clase define el prefijo y cómo armar los datos.

    - ``prefijo``: ruta de la API, por ejemplo ``'ciudades'``.
    - ``crear_objeto()``: crea un registro en la base y lo devuelve.
    - ``datos_validos()``: diccionario JSON válido para POST y PUT.
    - ``datos_invalidos()``: diccionario que debe responder 400.
    - ``campo_invalido``: campo que debe aparecer en el error 400.
    - ``datos_parciales()``: diccionario para PATCH.
    """

    prefijo = None
    campo_invalido = None

    def url_lista(self):
        return f'/api/{self.prefijo}/'

    def url_detalle(self, pk):
        return f'/api/{self.prefijo}/{pk}/'

    def datos_parciales(self):
        return {}

    def test_listar_devuelve_200(self):
        objeto = self.crear_objeto()
        respuesta = self.client.get(self.url_lista())
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertIn(objeto.pk, [fila['id'] for fila in respuesta.data['results']])

    def test_crear_devuelve_201(self):
        datos = self.datos_validos()
        antes = self.client.get(self.url_lista()).data['count']
        respuesta = self.client.post(self.url_lista(), datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED, respuesta.data)
        self.assertEqual(self.client.get(self.url_lista()).data['count'], antes + 1)

    def test_consultar_devuelve_200(self):
        objeto = self.crear_objeto()
        respuesta = self.client.get(self.url_detalle(objeto.pk))
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)
        self.assertEqual(respuesta.data['id'], objeto.pk)

    def test_reemplazar_devuelve_200(self):
        objeto = self.crear_objeto()
        respuesta = self.client.put(self.url_detalle(objeto.pk), self.datos_validos(), format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK, respuesta.data)

    def test_modificar_parcial_devuelve_200(self):
        objeto = self.crear_objeto()
        respuesta = self.client.patch(self.url_detalle(objeto.pk), self.datos_parciales(), format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK, respuesta.data)

    def test_eliminar_devuelve_204(self):
        objeto = self.crear_objeto()
        respuesta = self.client.delete(self.url_detalle(objeto.pk))
        self.assertEqual(respuesta.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(self.client.get(self.url_detalle(objeto.pk)).status_code, status.HTTP_404_NOT_FOUND)

    def test_datos_invalidos_devuelven_400(self):
        respuesta = self.client.post(self.url_lista(), self.datos_invalidos(), format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        if self.campo_invalido:
            self.assertIn(self.campo_invalido, respuesta.data)

    def test_registro_inexistente_devuelve_404(self):
        self.assertEqual(self.client.get(self.url_detalle(999999)).status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(
            self.client.put(self.url_detalle(999999), {}, format='json').status_code,
            status.HTTP_404_NOT_FOUND,
        )
        self.assertEqual(self.client.delete(self.url_detalle(999999)).status_code, status.HTTP_404_NOT_FOUND)
