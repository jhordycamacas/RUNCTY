from datetime import date, timedelta

from rest_framework import status
from rest_framework.test import APITestCase

from config import pruebas as f
from config.pruebas import CrudApiMixin

from .models import PerfilDeportivo, Preferencia, Usuario


class RolApiTests(CrudApiMixin, APITestCase):
    prefijo = 'roles'
    campo_invalido = 'nombre'

    def crear_objeto(self):
        return f.rol()

    def datos_validos(self):
        return {'nombre': f'Corredor {f.n()}', 'descripcion': 'Consulta rutas'}

    def datos_invalidos(self):
        return {'nombre': 'ab'}

    def datos_parciales(self):
        return {'descripcion': 'Nuevo texto'}


class UsuarioApiTests(CrudApiMixin, APITestCase):
    prefijo = 'usuarios'
    campo_invalido = 'correo'

    def crear_objeto(self):
        return f.usuario()

    def datos_validos(self):
        return {
            'nombre': 'Luis', 'apellido': 'Jaramillo', 'correo': f'luis{f.n()}@runcty.ec',
            'fecha_nacimiento': '1995-03-20', 'ciudad': f.ciudad().pk, 'rol': f.rol().pk,
            'nivel': 'INTERMEDIO', 'acepta_terminos': True,
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['correo'] = 'no-es-correo'
        return datos

    def datos_parciales(self):
        return {'nivel': 'AVANZADO'}

    def test_fecha_de_nacimiento_futura_devuelve_400(self):
        datos = self.datos_validos()
        datos['fecha_nacimiento'] = str(date.today() + timedelta(days=5))
        respuesta = self.client.post('/api/usuarios/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('fecha_nacimiento', respuesta.data)

    def test_correo_repetido_devuelve_400(self):
        datos = self.datos_validos()
        self.client.post('/api/usuarios/', datos, format='json')
        respuesta = self.client.post('/api/usuarios/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('correo', respuesta.data)

    def test_eliminar_usuario_elimina_perfil_y_preferencias(self):
        usuario = f.usuario()
        PerfilDeportivo.objects.create(usuario=usuario, peso_kg=60, estatura_cm=165)
        Preferencia.objects.create(usuario=usuario)
        self.client.delete(f'/api/usuarios/{usuario.pk}/')
        self.assertFalse(Usuario.objects.filter(pk=usuario.pk).exists())
        self.assertEqual(PerfilDeportivo.objects.count(), 0)
        self.assertEqual(Preferencia.objects.count(), 0)


class PerfilDeportivoApiTests(CrudApiMixin, APITestCase):
    prefijo = 'perfiles-deportivos'
    campo_invalido = 'peso_kg'

    def crear_objeto(self):
        return PerfilDeportivo.objects.create(usuario=f.usuario(), peso_kg=70, estatura_cm=172)

    def datos_validos(self):
        return {
            'usuario': f.usuario().pk, 'peso_kg': 62.5, 'estatura_cm': 168,
            'objetivo': 'PREPARAR_CARRERA', 'km_semanales': 20,
        }

    def datos_invalidos(self):
        datos = self.datos_validos()
        datos['peso_kg'] = 500
        return datos

    def datos_parciales(self):
        return {'km_semanales': 35}

    def test_un_solo_perfil_por_usuario(self):
        perfil = self.crear_objeto()
        datos = self.datos_validos()
        datos['usuario'] = perfil.usuario_id
        respuesta = self.client.post('/api/perfiles-deportivos/', datos, format='json')
        self.assertEqual(respuesta.status_code, status.HTTP_400_BAD_REQUEST)


class PreferenciaApiTests(CrudApiMixin, APITestCase):
    prefijo = 'preferencias'
    campo_invalido = 'tema'

    def crear_objeto(self):
        return Preferencia.objects.create(usuario=f.usuario())

    def datos_validos(self):
        return {'usuario': f.usuario().pk, 'tema': 'OSCURO', 'tamano_letra': 'GRANDE'}

    def datos_invalidos(self):
        return {'usuario': f.usuario().pk, 'tema': 'ROSADO'}

    def datos_parciales(self):
        return {'notificaciones': False}
