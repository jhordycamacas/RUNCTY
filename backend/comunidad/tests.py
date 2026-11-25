from datetime import date, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin

from .models import (
    Favorita, Notificacion, ReporteComunitario, Reto, SolicitudCompanero, Valoracion,
)


class FavoritaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'favoritas'
    campo_invalido = 'ruta'

    def crear_objeto(self):
        return Favorita.objects.create(usuario=f.usuario(), ruta=f.ruta())

    def datos_validos(self):
        return {'usuario': f.usuario().pk, 'ruta': f.ruta().pk}

    def datos_invalidos(self):
        return {'usuario': f.usuario().pk, 'ruta': 999999}

    def test_favorita_repetida_devuelve_400(self):
        favorita = self.crear_objeto()
        datos = {'usuario': favorita.usuario_id, 'ruta': favorita.ruta_id}
        respuesta = self.client.post('/api/favoritas/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)


class ValoracionApiTests(CrudApiMixin, APITestCase):
    prefijo = 'valoraciones'
    campo_invalido = 'seguridad'

    def crear_objeto(self):
        return Valoracion.objects.create(
            usuario=f.usuario(), ruta=f.ruta(), seguridad=4, iluminacion=3, afluencia=5
        )

    def datos_validos(self):
        return {'usuario': f.usuario().pk, 'ruta': f.ruta().pk, 'seguridad': 5, 'iluminacion': 4, 'afluencia': 3}

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['seguridad'] = 6
        return datos

    def datos_parciales(self):
        return {'comentario': 'Muy iluminada'}

    def test_una_sola_valoracion_por_usuario_y_ruta(self):
        valoracion = self.crear_objeto()
        datos = self.datos_validos()
        datos.update(usuario=valoracion.usuario_id, ruta=valoracion.ruta_id)
        respuesta = self.client.post('/api/valoraciones/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('non_field_errors', respuesta.data)

    def test_calificacion_cero_devuelve_400(self):
        datos = self.datos_validos()
        datos['afluencia'] = 0
        respuesta = self.client.post('/api/valoraciones/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('afluencia', respuesta.data)


class RetoApiTests(CrudApiMixin, APITestCase):
    prefijo = 'retos'
    campo_invalido = 'retado'

    def crear_objeto(self):
        return Reto.objects.create(
            creador=f.usuario(), retado=f.usuario(), titulo='50 km en noviembre', tipo='DISTANCIA',
            valor_objetivo=50, fecha_inicio=date.today(), fecha_fin=date.today() + timedelta(days=30),
        )

    def datos_validos(self):
        return {
            'creador': f.usuario().pk, 'retado': f.usuario().pk, 'titulo': '3 salidas', 'tipo': 'FRECUENCIA',
            'valor_objetivo': 3, 'fecha_inicio': str(date.today()),
            'fecha_fin': str(date.today() + timedelta(days=7)),
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['retado'] = datos['creador']
        return datos

    def datos_parciales(self):
        return {'estado': 'ACEPTADO'}


class ReporteComunitarioApiTests(CrudApiMixin, APITestCase):
    prefijo = 'reportes-comunitarios'
    campo_invalido = 'ruta'

    def crear_objeto(self):
        return ReporteComunitario.objects.create(
            usuario=f.usuario(), ruta=f.ruta(), tipo='ILUMINACION', descripcion='Postes apagados'
        )

    def datos_validos(self):
        return {'usuario': f.usuario().pk, 'zona': f.zona().pk, 'tipo': 'INSEGURIDAD', 'descripcion': 'Asaltos'}

    def datos_invalidos(self):
        # Sin ruta ni zona.
        return {'usuario': f.usuario().pk, 'tipo': 'OTRO', 'descripcion': 'Algo pasó'}

    def datos_parciales(self):
        return {'estado': 'APROBADO', 'observacion': 'Verificado'}

    def test_identidad_del_reportante_no_se_devuelve(self):
        reporte = self.crear_objeto()
        respuesta = self.client.get(f'/api/reportes-comunitarios/{reporte.pk}/')
        self.assertNotIn('usuario', respuesta.data)

    def test_filtrar_solo_aprobados(self):
        self.crear_objeto()
        aprobado = self.crear_objeto()
        aprobado.estado = 'APROBADO'
        aprobado.save()
        respuesta = self.client.get('/api/reportes-comunitarios/?estado=APROBADO')
        self.assertEqual([r['id'] for r in respuesta.data['results']], [aprobado.pk])


class NotificacionApiTests(CrudApiMixin, APITestCase):
    prefijo = 'notificaciones'
    campo_invalido = 'titulo'

    def crear_objeto(self):
        return Notificacion.objects.create(usuario=f.usuario(), titulo='Bienvenido', mensaje='Hola')

    def datos_validos(self):
        return {'usuario': f.usuario().pk, 'titulo': 'Nuevo reto', 'mensaje': 'Te retaron', 'tipo': 'RETO'}

    def datos_invalidos(self):
        return {'usuario': f.usuario().pk, 'titulo': '', 'mensaje': 'Sin título'}

    def datos_parciales(self):
        return {'leida': True}


class SolicitudCompaneroApiTests(CrudApiMixin, APITestCase):
    prefijo = 'solicitudes-companero'
    campo_invalido = 'receptor'

    def crear_objeto(self):
        return SolicitudCompanero.objects.create(solicitante=f.usuario(), receptor=f.usuario())

    def datos_validos(self):
        return {'solicitante': f.usuario().pk, 'receptor': f.usuario().pk, 'mensaje': '¿Corremos el sábado?'}

    def datos_invalidos(self):
        usuario = f.usuario().pk
        return {'solicitante': usuario, 'receptor': usuario}

    def datos_parciales(self):
        return {'estado': 'ACEPTADA'}
