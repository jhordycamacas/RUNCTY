from datetime import time, timedelta

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin

from .indice import nivel_por_puntaje
from .models import AlertaZona, FactorRiesgo, Incidente, SolicitudRutaSegura


class NivelPorPuntajeTests(SimpleTestCase):
    def test_limites_de_los_niveles(self):
        self.assertEqual(nivel_por_puntaje(100), 'Alto')
        self.assertEqual(nivel_por_puntaje(70), 'Alto')
        self.assertEqual(nivel_por_puntaje(69), 'Medio')
        self.assertEqual(nivel_por_puntaje(40), 'Medio')
        self.assertEqual(nivel_por_puntaje(39), 'Bajo')
        self.assertEqual(nivel_por_puntaje(0), 'Bajo')


class FranjaHorariaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'franjas-horarias'
    campo_invalido = 'hora_fin'

    def crear_objeto(self):
        return f.franja()

    def datos_validos(self):
        return {'ruta': f.ruta().pk, 'nombre': 'Tarde', 'hora_inicio': '18:00', 'hora_fin': '20:00'}

    def datos_invalidos(self):
        return {'ruta': f.ruta().pk, 'nombre': 'Al revés', 'hora_inicio': '20:00', 'hora_fin': '18:00'}

    def datos_parciales(self):
        return {'nombre': 'Amanecer'}

    def test_franjas_solapadas_de_la_misma_ruta_devuelven_400(self):
        franja = f.franja(inicio=time(5, 0), fin=time(7, 0))
        datos = {'ruta': franja.ruta_id, 'nombre': 'Cruce', 'hora_inicio': '06:30', 'hora_fin': '08:00'}
        respuesta = self.client.post('/api/franjas-horarias/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('hora_inicio', respuesta.data)

    def test_franjas_contiguas_si_se_permiten(self):
        franja = f.franja(inicio=time(5, 0), fin=time(7, 0))
        datos = {'ruta': franja.ruta_id, 'nombre': 'Mañana', 'hora_inicio': '07:00', 'hora_fin': '09:00'}
        respuesta = self.client.post('/api/franjas-horarias/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)

    def test_editar_una_franja_no_choca_consigo_misma(self):
        franja = f.franja(inicio=time(5, 0), fin=time(7, 0))
        respuesta = self.client.patch(
            f'/api/franjas-horarias/{franja.pk}/', {'hora_fin': '07:30'}, format='json'
        )
        self.assertEqual(respuesta.status_code, status.HTTP_200_OK)


class FactorRiesgoApiTests(CrudApiMixin, APITestCase):
    prefijo = 'factores-riesgo'
    campo_invalido = 'severidad'

    def crear_objeto(self):
        tramo = f.tramo()
        return FactorRiesgo.objects.create(
            tramo=tramo, franja=f.franja(tramo.ruta), tipo='ILUMINACION', severidad='MEDIA'
        )

    def datos_validos(self):
        tramo = f.tramo()
        return {'tramo': tramo.pk, 'franja': f.franja(tramo.ruta).pk, 'tipo': 'PERROS', 'severidad': 'BAJA'}

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['severidad'] = 'EXTREMA'
        return datos

    def datos_parciales(self):
        return {'activo': False}

    def test_franja_de_otra_ruta_devuelve_400(self):
        datos = {'tramo': f.tramo().pk, 'franja': f.franja().pk, 'tipo': 'PERROS', 'severidad': 'BAJA'}
        respuesta = self.client.post('/api/factores-riesgo/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('franja', respuesta.data)


class AlertaZonaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'alertas-zona'
    campo_invalido = 'fecha_fin'

    def crear_objeto(self):
        return AlertaZona.objects.create(zona=f.zona(), titulo='Poca luz', fecha_inicio=timezone.now())

    def datos_validos(self):
        inicio = timezone.now()
        return {
            'zona': f.zona().pk, 'titulo': 'Obras en la vía', 'nivel': 'PRECAUCION',
            'fecha_inicio': inicio.isoformat(), 'fecha_fin': (inicio + timedelta(days=3)).isoformat(),
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['fecha_fin'] = (timezone.now() - timedelta(days=3)).isoformat()
        return datos

    def datos_parciales(self):
        return {'activa': False}


class FuenteInformacionApiTests(CrudApiMixin, APITestCase):
    prefijo = 'fuentes-informacion'
    campo_invalido = 'confiabilidad'

    def crear_objeto(self):
        return f.fuente()

    def datos_validos(self):
        return {'nombre': f'Municipio {f.n()}', 'tipo': 'MUNICIPIO', 'confiabilidad': 4}

    def datos_invalidos(self):
        return {'nombre': 'Mala', 'tipo': 'MUNICIPIO', 'confiabilidad': 9}

    def datos_parciales(self):
        return {'confiabilidad': 5}


class IncidenteApiTests(CrudApiMixin, APITestCase):
    prefijo = 'incidentes'
    campo_invalido = 'fecha'

    def crear_objeto(self):
        return Incidente.objects.create(zona=f.zona(), tipo='ROBO', descripcion='Robo de celular', fecha=f.ayer())

    def datos_validos(self):
        return {
            'zona': f.zona().pk, 'fuente': f.fuente().pk, 'tipo': 'ACOSO',
            'descripcion': 'Reportado por la policía', 'fecha': f.ayer().isoformat(),
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['fecha'] = f.manana().isoformat()
        return datos

    def datos_parciales(self):
        return {'descripcion': 'Actualizado'}


class SolicitudRutaSeguraApiTests(CrudApiMixin, APITestCase):
    prefijo = 'solicitudes-ruta-segura'
    campo_invalido = 'hora'

    def crear_objeto(self):
        usuario = f.usuario()
        return SolicitudRutaSegura.objects.create(usuario=usuario, ciudad=usuario.ciudad, hora=time(6, 0))

    def datos_validos(self):
        usuario = f.usuario()
        return {'usuario': usuario.pk, 'ciudad': usuario.ciudad_id, 'hora': '06:00'}

    def datos_invalidos(self):
        usuario = f.usuario()
        return {'usuario': usuario.pk, 'ciudad': usuario.ciudad_id, 'hora': '25:99'}

    def datos_parciales(self):
        return {'hora': '18:30'}

    def test_recomienda_rutas_de_la_ciudad_ordenadas_por_seguridad(self):
        usuario = f.usuario()
        ciudad = usuario.ciudad
        segura, insegura, media = f.ruta(ciudad), f.ruta(ciudad), f.ruta(ciudad)
        sin_franja = f.ruta(ciudad)
        f.ruta()  # otra ciudad: no debe aparecer
        for ruta in (segura, insegura, media):
            f.tramo(ruta)
            f.franja(ruta)
        f.tramo(sin_franja)
        FactorRiesgo.objects.create(
            tramo=insegura.tramos.first(), franja=insegura.franjas.first(), tipo='DELINCUENCIA', severidad='ALTA'
        )
        FactorRiesgo.objects.create(
            tramo=insegura.tramos.first(), franja=insegura.franjas.first(), tipo='ILUMINACION', severidad='ALTA'
        )
        FactorRiesgo.objects.create(
            tramo=media.tramos.first(), franja=media.franjas.first(), tipo='TRAFICO', severidad='MEDIA'
        )

        respuesta = self.client.post(
            '/api/solicitudes-ruta-segura/',
            {'usuario': usuario.pk, 'ciudad': ciudad.pk, 'hora': '06:15'},
            format='json',
        )

        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        recomendadas = respuesta.data['rutas_recomendadas']
        self.assertEqual([r['ruta'] for r in recomendadas], [segura.pk, media.pk, insegura.pk])
        self.assertEqual([r['nivel'] for r in recomendadas], ['Alto', 'Alto', 'Bajo'])
        self.assertEqual([r['puntaje'] for r in recomendadas], [100, 80, 30])

    def test_hora_sin_franja_no_recomienda_rutas(self):
        usuario = f.usuario()
        ruta = f.ruta(usuario.ciudad)
        f.franja(ruta)
        respuesta = self.client.post(
            '/api/solicitudes-ruta-segura/',
            {'usuario': usuario.pk, 'ciudad': usuario.ciudad_id, 'hora': '12:00'},
            format='json',
        )
        self.assertEqual(respuesta.status_code, status.HTTP_201_CREATED)
        self.assertEqual(respuesta.data['rutas_recomendadas'], [])
