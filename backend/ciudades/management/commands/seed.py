"""Carga datos de ejemplo de Loja para todas las entidades. Se puede ejecutar varias veces sin duplicar nada."""
from datetime import date, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from ciudades.models import Ciudad, Zona
from clubes.models import Club, Membresia, PuntoEncuentro, RutaClub, SalidaGrupal
from comunidad.models import (
    Favorita, Notificacion, ReporteComunitario, Reto, SolicitudCompanero, Valoracion,
)
from entrenamiento.models import Entrenamiento, MetaPersonal
from eventos.models import Evento, Inscripcion
from publicidad.models import Anunciante, Campana
from rutas.models import PuntoApoyo, Ruta, SenderoResguardado, Tramo
from seguridad.models import (
    AlertaZona, FactorRiesgo, FranjaHoraria, FuenteInformacion, Incidente, SolicitudRutaSegura,
)
from seguridad_personal.models import AlertaPanico, ContactoConfianza, UbicacionCompartida
from usuarios.models import PerfilDeportivo, Preferencia, Rol, Usuario

ZONAS = [
    ('Jipiro', 'PARQUE'), ('La Tebaida', 'PARQUE'), ('Centro Histórico', 'URBANA'),
    ('Zamora Huayco', 'URBANA'), ('San Sebastián', 'URBANA'), ('Sauces Norte', 'URBANA'),
]

# nombre, zona, km, dificultad, superficie, tramos [(nombre, km)], factores [(tramo, franja, tipo, severidad)]
RUTAS = [
    ('Parque Recreacional Jipiro', 'Jipiro', 3.2, 'FACIL', 'ASFALTO',
     [('Entrada principal', 1.0), ('Lagunas', 1.2), ('Pagoda china', 1.0)],
     []),
    ('Parque Lineal La Tebaida', 'La Tebaida', 4.0, 'FACIL', 'MIXTA',
     [('Puente La Tebaida', 1.5), ('Orilla del río', 1.5), ('Retorno', 1.0)],
     [(2, 'madrugada', 'ILUMINACION', 'MEDIA')]),
    ('Malecón del río Zamora', 'Centro Histórico', 5.5, 'MEDIA', 'ASFALTO',
     [('Puerta de la Ciudad', 2.0), ('Mercado Centro Comercial', 2.0), ('San Sebastián', 1.5)],
     [(2, 'madrugada', 'SOLEDAD', 'ALTA'), (2, 'madrugada', 'DELINCUENCIA', 'MEDIA'),
      (3, 'tarde', 'TRAFICO', 'BAJA')]),
    ('Subida a Zamora Huayco', 'Zamora Huayco', 6.0, 'DIFICIL', 'MIXTA',
     [('Barrio Zamora Huayco', 2.5), ('Vía a la planta de agua', 3.5)],
     [(2, 'madrugada', 'ILUMINACION', 'ALTA'), (2, 'madrugada', 'PERROS', 'MEDIA'),
      (2, 'tarde', 'TERRENO', 'BAJA')]),
    ('Circuito Sauces Norte', 'Sauces Norte', 4.5, 'MEDIA', 'ASFALTO',
     [('Avenida 8 de Diciembre', 2.5), ('Parque Sauces', 2.0)],
     [(1, 'tarde', 'TRAFICO', 'MEDIA')]),
]

FRANJAS = {'madrugada': ('Madrugada', time(5, 0), time(7, 0)), 'tarde': ('Tarde', time(18, 0), time(20, 0))}


class Command(BaseCommand):
    help = 'Carga datos de ejemplo de Loja para todas las entidades de RUNCTY.'

    @transaction.atomic
    def handle(self, *args, **options):
        self.ahora = timezone.now()
        self.hoy = timezone.localdate()

        loja, zonas = self._ciudades()
        u = self._usuarios(loja)
        r = self._rutas(loja, zonas)
        self._seguridad(loja, zonas, u, r)
        self._seguridad_personal(u)
        self._entrenamiento(u, r)
        self._comunidad(zonas, u, r)
        self._clubes(loja, u, r)
        self._eventos(loja, u, r)
        self._publicidad()

        self.stdout.write(self.style.SUCCESS(
            f'Datos de Loja listos: {Ruta.objects.count()} rutas, {Usuario.objects.count()} usuarios.'))

    # ciudades -----------------------------------------------------------------------------------------------
    def _ciudades(self):
        loja, _ = Ciudad.objects.update_or_create(nombre='Loja', defaults={'provincia': 'Loja'})
        catamayo, _ = Ciudad.objects.update_or_create(nombre='Catamayo', defaults={'provincia': 'Loja'})
        zonas = {
            nombre: Zona.objects.update_or_create(ciudad=loja, nombre=nombre, defaults={'tipo': tipo})[0]
            for nombre, tipo in ZONAS
        }
        Zona.objects.update_or_create(
            ciudad=catamayo, nombre='Centro de Catamayo',
            defaults={'tipo': 'URBANA', 'descripcion': 'Parque central y avenida Isidro Ayora.'})
        return loja, zonas

    # usuarios -----------------------------------------------------------------------------------------------
    def _usuarios(self, loja):
        roles = {
            nombre: Rol.objects.update_or_create(
                nombre=nombre, defaults={'descripcion': descripcion, 'permisos': permisos})[0]
            for nombre, descripcion, permisos in [
                ('Corredor', 'Consulta rutas, registra entrenamientos y usa el botón de pánico.',
                 'rutas.ver,entrenamientos.registrar,panico.usar'),
                ('Administrador', 'Gestiona rutas, horarios, reportes y publicidad.',
                 'rutas.gestionar,reportes.validar,publicidad.gestionar'),
                ('Representante de club', 'Aporta rutas de su ciudad y apoya la revisión de reportes.',
                 'clubes.gestionar,rutas.sugerir,reportes.revisar'),
            ]
        }
        corredor, representante = roles['Corredor'], roles['Representante de club']
        u = {
            'ana': self._usuario('ana.torres@runcty.ec', 'Ana', 'Torres', date(1997, 4, 12), loja,
                                 corredor, 'INTERMEDIO'),
            'luis': self._usuario('luis.jaramillo@runcty.ec', 'Luis', 'Jaramillo', date(1990, 9, 3), loja,
                                  representante, 'AVANZADO'),
            'gabriela': self._usuario('admin@runcty.ec', 'Gabriela', 'Celi', date(1988, 1, 20), loja,
                                      roles['Administrador'], 'INTERMEDIO'),
            'maria': self._usuario('maria.ochoa@runcty.ec', 'María', 'Ochoa', date(2001, 7, 28), loja,
                                   corredor, 'PRINCIPIANTE'),
            'carlos': self._usuario('carlos.guaman@runcty.ec', 'Carlos', 'Guamán', date(1985, 11, 5), loja,
                                    corredor, 'INTERMEDIO'),
            'sofia': self._usuario('sofia.castillo@runcty.ec', 'Sofía', 'Castillo', date(1993, 2, 14), loja,
                                   representante, 'AVANZADO'),
        }
        perfiles = {
            'ana': {'peso_kg': 58, 'estatura_cm': 162, 'objetivo': 'PREPARAR_CARRERA',
                    'km_semanales': 25, 'ritmo_objetivo_min_km': 6},
            'luis': {'peso_kg': 70, 'estatura_cm': 175, 'objetivo': 'MEJORAR_RITMO',
                     'km_semanales': 45, 'ritmo_objetivo_min_km': 4.5},
            'maria': {'peso_kg': 63, 'estatura_cm': 158, 'objetivo': 'SALUD', 'km_semanales': 10},
            'carlos': {'peso_kg': 82, 'estatura_cm': 170, 'objetivo': 'BAJAR_PESO',
                       'km_semanales': 18, 'ritmo_objetivo_min_km': 7},
        }
        for clave, datos in perfiles.items():
            PerfilDeportivo.objects.update_or_create(usuario=u[clave], defaults=datos)
        preferencias = {
            'ana': {'tema': 'CLARO', 'compartir_ubicacion': True},
            'luis': {'tema': 'OSCURO', 'compartir_ubicacion': True},
            'maria': {'tema': 'CLARO', 'tamano_letra': 'GRANDE'},
            'carlos': {'tema': 'OSCURO', 'notificaciones': False},
        }
        for clave, datos in preferencias.items():
            Preferencia.objects.update_or_create(usuario=u[clave], defaults=datos)
        return u

    @staticmethod
    def _usuario(correo, nombre, apellido, nacimiento, ciudad, rol, nivel):
        return Usuario.objects.update_or_create(
            correo=correo,
            defaults={'nombre': nombre, 'apellido': apellido, 'fecha_nacimiento': nacimiento,
                      'ciudad': ciudad, 'rol': rol, 'nivel': nivel, 'acepta_terminos': True})[0]

    # rutas --------------------------------------------------------------------------------------------------
    def _rutas(self, loja, zonas):
        rutas = []
        for nombre, zona, km, dificultad, superficie, tramos, factores in RUTAS:
            ruta, _ = Ruta.objects.update_or_create(
                ciudad=loja, nombre=nombre,
                defaults={'distancia_km': km, 'dificultad': dificultad, 'superficie': superficie,
                          'descripcion': f'Ruta en {zona}, Loja.'})
            for orden, (nombre_tramo, km_tramo) in enumerate(tramos, start=1):
                Tramo.objects.update_or_create(
                    ruta=ruta, orden=orden,
                    defaults={'nombre': nombre_tramo, 'distancia_km': km_tramo, 'zona': zonas[zona]})
            franjas = {
                clave: FranjaHoraria.objects.update_or_create(
                    ruta=ruta, hora_inicio=inicio, defaults={'nombre': etiqueta, 'hora_fin': fin})[0]
                for clave, (etiqueta, inicio, fin) in FRANJAS.items()
            }
            for orden, clave, tipo, severidad in factores:
                FactorRiesgo.objects.update_or_create(
                    tramo=ruta.tramos.get(orden=orden), franja=franjas[clave], tipo=tipo,
                    defaults={'severidad': severidad})
            rutas.append(ruta)
        r = dict(zip(['jipiro', 'tebaida', 'malecon', 'huayco', 'sauces'], rutas))

        puntos = [
            (r['jipiro'], 'UPC Jipiro', 'PUESTO_POLICIAL', -3.9731, -79.2045, '24 horas'),
            (r['malecon'], 'Hospital Isidro Ayora', 'CENTRO_SALUD', -3.9930, -79.2040, '24 horas'),
            (r['malecon'], 'Plaza de San Sebastián', 'LUGAR_CONCURRIDO', -4.0003, -79.2010,
             'Todos los días 06:00-22:00'),
            (r['tebaida'], 'Farmacia La Tebaida', 'COMERCIO_ABIERTO', -4.0170, -79.2050,
             'Lunes a sábado 07:00-21:00'),
        ]
        for ruta, nombre, tipo, latitud, longitud, horario in puntos:
            PuntoApoyo.objects.update_or_create(
                ruta=ruta, nombre=nombre,
                defaults={'tipo': tipo, 'latitud': latitud, 'longitud': longitud, 'horario': horario})

        senderos = [
            (r['tebaida'], time(5, 30), time(7, 0), 'Lunes a sábado', 'Policía Nacional'),
            (r['malecon'], time(18, 0), time(20, 0), 'Lunes a viernes', 'Policía Nacional'),
            (r['jipiro'], time(6, 0), time(9, 0), 'Sábado y domingo', 'Guardia Municipal de Loja'),
        ]
        for ruta, inicio, fin, dias, institucion in senderos:
            SenderoResguardado.objects.update_or_create(
                ruta=ruta, hora_inicio=inicio,
                defaults={'hora_fin': fin, 'dias': dias, 'institucion': institucion})
        return r

    # seguridad ----------------------------------------------------------------------------------------------
    def _seguridad(self, loja, zonas, u, r):
        ahora = self.ahora
        fuentes = {
            clave: FuenteInformacion.objects.update_or_create(
                nombre=nombre, defaults={'tipo': tipo, 'confiabilidad': confiabilidad, 'contacto': contacto})[0]
            for clave, nombre, tipo, confiabilidad, contacto in [
                ('policia', 'Policía Nacional - Subzona Loja', 'POLICIA', 5, 'ECU 911'),
                ('club', 'Club Gacelas', 'CLUB', 4, 'gacelas@runcty.ec'),
                ('municipio', 'Municipio de Loja', 'MUNICIPIO', 4, 'Dirección de Seguridad Ciudadana'),
                ('comunidad', 'Reportes de la comunidad RUNCTY', 'COMUNIDAD', 3, ''),
            ]
        }

        incidentes = [
            ('Centro Histórico', 'ROBO', 'Robo de celular a un corredor.', r['malecon'], 'policia', 5,
             -3.9935, -79.2042),
            ('Zamora Huayco', 'ACOSO', 'Acoso verbal a una corredora en la subida.', r['huayco'], 'comunidad', 12,
             -3.9990, -79.1880),
            ('Sauces Norte', 'ACCIDENTE', 'Corredor atropellado levemente en un cruce sin semáforo.',
             r['sauces'], 'municipio', 20, -3.9620, -79.2080),
        ]
        for zona, tipo, descripcion, ruta, fuente, dias, latitud, longitud in incidentes:
            Incidente.objects.update_or_create(
                zona=zonas[zona], tipo=tipo, descripcion=descripcion,
                defaults={'ruta': ruta, 'fuente': fuentes[fuente], 'fecha': ahora - timedelta(days=dias),
                          'latitud': latitud, 'longitud': longitud})

        alertas = [
            ('Zamora Huayco', 'Tramo sin alumbrado', 'PRECAUCION', 'Postes dañados en la vía a la planta de agua.',
             -1, 14),
            ('Centro Histórico', 'Operativo de seguridad en el Malecón', 'INFORMATIVA',
             'Patrullaje policial de 18:00 a 20:00.', -2, 30),
            ('La Tebaida', 'Crecida del río Zamora', 'PELIGRO', 'Evite la orilla del río durante las lluvias.',
             0, 3),
        ]
        for zona, titulo, nivel, descripcion, desde, hasta in alertas:
            AlertaZona.objects.update_or_create(
                zona=zonas[zona], titulo=titulo,
                defaults={'nivel': nivel, 'descripcion': descripcion,
                          'fecha_inicio': ahora + timedelta(days=desde),
                          'fecha_fin': ahora + timedelta(days=hasta)})

        for usuario, hora, distancia in [(u['ana'], time(6, 0), 5), (u['maria'], time(18, 30), 4.5),
                                         (u['luis'], time(5, 30), None)]:
            SolicitudRutaSegura.objects.update_or_create(
                usuario=usuario, ciudad=loja, hora=hora, defaults={'distancia_max_km': distancia})

    # seguridad personal -------------------------------------------------------------------------------------
    def _seguridad_personal(self, u):
        contactos = {}
        for clave, usuario, nombre, telefono, parentesco, correo in [
            ('rosa', u['ana'], 'Rosa Torres', '0991234567', 'Madre', ''),
            ('pedro', u['ana'], 'Pedro Torres', '0987654321', 'Hermano', 'pedro.torres@gmail.com'),
            ('jorge', u['maria'], 'Jorge Ochoa', '0998877665', 'Padre', ''),
            ('lucia', u['carlos'], 'Lucía Guamán', '0976543210', 'Esposa', 'lucia.guaman@gmail.com'),
        ]:
            contactos[clave] = ContactoConfianza.objects.update_or_create(
                usuario=usuario, telefono=telefono,
                defaults={'nombre': nombre, 'parentesco': parentesco, 'correo': correo})[0]

        # Solo usuarios con al menos un contacto de confianza pueden usar el botón de pánico.
        for usuario, mensaje, estado, latitud, longitud in [
            (u['ana'], 'Me siguen en el Malecón, cerca del mercado.', 'ATENDIDA', -3.9950, -79.2035),
            (u['maria'], 'Alerta enviada por error.', 'CANCELADA', -4.0165, -79.2048),
        ]:
            AlertaPanico.objects.update_or_create(
                usuario=usuario, mensaje=mensaje,
                defaults={'estado': estado, 'latitud': latitud, 'longitud': longitud})

        UbicacionCompartida.objects.get_or_create(
            usuario=u['ana'], contacto=contactos['rosa'],
            defaults={'latitud': -3.9731, 'longitud': -79.2045, 'activa': True})
        ubicacion, creada = UbicacionCompartida.objects.get_or_create(
            usuario=u['maria'], contacto=contactos['jorge'],
            defaults={'latitud': -4.0170, 'longitud': -79.2050})
        if creada:  # sesión ya terminada: inicio es auto_now_add, por eso se ajusta después de crearla
            inicio = self.ahora - timedelta(days=2)
            UbicacionCompartida.objects.filter(pk=ubicacion.pk).update(
                inicio=inicio, fin=inicio + timedelta(minutes=45), activa=False)

    # entrenamiento ------------------------------------------------------------------------------------------
    def _entrenamiento(self, u, r):
        sesiones = [
            (u['ana'], r['jipiro'], 'Entrenamiento de ejemplo', 1, 20, 3.2, 210,
             [{'lat': -3.9731, 'lng': -79.2045}, {'lat': -3.9705, 'lng': -79.2030}]),
            (u['luis'], r['huayco'], 'Cuestas en Zamora Huayco', 2, 38, 6.0, 520,
             [{'lat': -3.9985, 'lng': -79.1900}, {'lat': -4.0040, 'lng': -79.1820}]),
            (u['maria'], r['tebaida'], 'Rodaje suave por el río', 3, 30, 4.0, 260,
             [{'lat': -4.0150, 'lng': -79.2055}, {'lat': -4.0190, 'lng': -79.2045}]),
            (u['carlos'], r['sauces'], 'Trote nocturno en Sauces', 4, 33, 4.5, 380,
             [{'lat': -3.9610, 'lng': -79.2090}, {'lat': -3.9640, 'lng': -79.2070}]),
        ]
        for usuario, ruta, notas, dias, minutos, km, calorias, puntos in sesiones:
            inicio = self.ahora - timedelta(days=dias, hours=2)
            Entrenamiento.objects.get_or_create(
                usuario=usuario, ruta=ruta, notas=notas,
                defaults={'fecha_inicio': inicio, 'fecha_fin': inicio + timedelta(minutes=minutos),
                          'distancia_km': km, 'calorias': calorias, 'puntos_gps': puntos})

        hoy = self.hoy
        for usuario, tipo, periodo, valor, dias in [
            (u['ana'], 'DISTANCIA', 'SEMANAL', 25, 7),
            (u['luis'], 'TIEMPO', 'MENSUAL', 600, 30),
            (u['maria'], 'FRECUENCIA', 'SEMANAL', 3, 7),
        ]:
            MetaPersonal.objects.get_or_create(
                usuario=usuario, tipo=tipo, periodo=periodo,
                defaults={'valor_objetivo': valor, 'fecha_inicio': hoy, 'fecha_fin': hoy + timedelta(days=dias)})

    # comunidad ----------------------------------------------------------------------------------------------
    def _comunidad(self, zonas, u, r):
        for usuario, ruta in [(u['ana'], r['jipiro']), (u['maria'], r['tebaida']),
                              (u['luis'], r['huayco']), (u['carlos'], r['sauces'])]:
            Favorita.objects.get_or_create(usuario=usuario, ruta=ruta)

        for usuario, ruta, seguridad, iluminacion, afluencia, comentario in [
            (u['ana'], r['jipiro'], 5, 4, 5, ''),
            (u['maria'], r['tebaida'], 4, 3, 4, 'Muy tranquila en la mañana.'),
            (u['carlos'], r['malecon'], 3, 3, 4, 'De noche hay tramos oscuros.'),
            (u['luis'], r['huayco'], 3, 2, 2, 'Exigente; mejor ir en grupo.'),
        ]:
            Valoracion.objects.update_or_create(
                usuario=usuario, ruta=ruta,
                defaults={'seguridad': seguridad, 'iluminacion': iluminacion, 'afluencia': afluencia,
                          'comentario': comentario})

        hoy = self.hoy
        for creador, retado, titulo, tipo, valor, estado in [
            (u['ana'], u['maria'], '20 km en dos semanas', 'DISTANCIA', 20, 'ACEPTADO'),
            (u['luis'], u['carlos'], 'Cuatro salidas antes del 10K', 'FRECUENCIA', 4, 'PENDIENTE'),
        ]:
            Reto.objects.update_or_create(
                creador=creador, retado=retado, titulo=titulo,
                defaults={'tipo': tipo, 'valor_objetivo': valor, 'estado': estado,
                          'fecha_inicio': hoy, 'fecha_fin': hoy + timedelta(days=14)})

        for lugar, tipo, descripcion, estado, observacion in [
            ({'usuario': u['ana'], 'ruta': r['malecon']}, 'ILUMINACION',
             'Postes apagados cerca del mercado.', 'APROBADO', ''),
            ({'usuario': u['maria'], 'zona': zonas['Zamora Huayco']}, 'OTRO',
             'Perros sueltos en la entrada del barrio.', 'PENDIENTE', ''),
            ({'usuario': u['carlos'], 'ruta': r['sauces']}, 'OBSTACULO',
             'Escombros en la vereda de la avenida 8 de Diciembre.', 'RESUELTO',
             'El municipio retiró los escombros.'),
        ]:
            ReporteComunitario.objects.get_or_create(
                **lugar, tipo=tipo,
                defaults={'descripcion': descripcion, 'estado': estado, 'observacion': observacion})

        for usuario, titulo, mensaje, tipo in [
            (u['ana'], 'Bienvenida a RUNCTY', 'Ya puedes consultar rutas seguras.', 'SISTEMA'),
            (u['maria'], 'Nuevo reto de Ana', 'Ana Torres te retó a correr 20 km en dos semanas.', 'RETO'),
            (u['luis'], 'Nueva solicitud en tu club', 'María Ochoa quiere unirse al Club Gacelas Loja.', 'CLUB'),
            (u['carlos'], 'Inscripción confirmada', 'Tu cupo en el 10K Ciudad de Loja está confirmado.', 'EVENTO'),
        ]:
            Notificacion.objects.get_or_create(
                usuario=usuario, titulo=titulo, defaults={'mensaje': mensaje, 'tipo': tipo})

        for solicitante, receptor, mensaje, estado in [
            (u['maria'], u['ana'], '¿Corremos juntas el sábado en Jipiro?', 'ACEPTADA'),
            (u['carlos'], u['luis'], 'Busco compañero para las cuestas de Zamora Huayco.', 'PENDIENTE'),
            (u['sofia'], u['maria'], '¿Te unes a un rodaje de 5 km el domingo?', 'RECHAZADA'),
        ]:
            SolicitudCompanero.objects.update_or_create(
                solicitante=solicitante, receptor=receptor, defaults={'mensaje': mensaje, 'estado': estado})

    # clubes -------------------------------------------------------------------------------------------------
    def _clubes(self, loja, u, r):
        gacelas, _ = Club.objects.update_or_create(
            nombre='Club Gacelas Loja',
            defaults={'ciudad': loja, 'representante': u['luis'], 'correo': 'gacelas@runcty.ec',
                      'descripcion': 'Club de corredores de Loja.', 'fecha_fundacion': date(2015, 3, 8)})
        podocarpus, _ = Club.objects.update_or_create(
            nombre='Corredores del Podocarpus',
            defaults={'ciudad': loja, 'representante': u['sofia'], 'correo': 'podocarpus@runcty.ec',
                      'descripcion': 'Club de trail y montaña en Loja.', 'fecha_fundacion': date(2019, 6, 15)})

        for club, usuario, estado in [(gacelas, u['ana'], 'ACTIVA'), (gacelas, u['maria'], 'PENDIENTE'),
                                      (podocarpus, u['carlos'], 'ACTIVA'), (podocarpus, u['luis'], 'ACEPTADA')]:
            Membresia.objects.update_or_create(club=club, usuario=usuario, defaults={'estado': estado})

        # Los clubes solo sugieren rutas de su ciudad (todas las rutas de ejemplo son de Loja).
        for club, ruta, comentario in [
            (gacelas, r['tebaida'], 'Plana e iluminada.'),
            (gacelas, r['jipiro'], 'Ideal para principiantes.'),
            (podocarpus, r['huayco'], 'Buena para entrenar cuestas.'),
            (podocarpus, r['malecon'], 'Rodaje largo de recuperación.'),
        ]:
            RutaClub.objects.update_or_create(club=club, ruta=ruta, defaults={'comentario': comentario})

        puntos = {}
        for clave, club, nombre, latitud, longitud, referencia in [
            ('puerta', gacelas, 'Puerta de la Ciudad', -3.9930, -79.2045, 'Junto al arco'),
            ('jipiro', gacelas, 'Entrada del Parque Jipiro', -3.9731, -79.2045, 'Frente al UPC'),
            ('huayco', podocarpus, 'Iglesia de Zamora Huayco', -3.9985, -79.1900, 'Parque del barrio'),
        ]:
            puntos[clave] = PuntoEncuentro.objects.update_or_create(
                club=club, nombre=nombre,
                defaults={'latitud': latitud, 'longitud': longitud, 'referencia': referencia})[0]

        for club, titulo, ruta, punto, cupo, dias, estado in [
            (gacelas, 'Fondo del sábado', r['tebaida'], puntos['puerta'], 30, 4, 'PROGRAMADA'),
            (gacelas, 'Rodaje en Jipiro', r['jipiro'], puntos['jipiro'], 20, -3, 'REALIZADA'),
            (podocarpus, 'Cuestas del domingo', r['huayco'], puntos['huayco'], 15, 5, 'PROGRAMADA'),
        ]:
            SalidaGrupal.objects.update_or_create(
                club=club, titulo=titulo,
                defaults={'ruta': ruta, 'punto_encuentro': punto, 'cupo': cupo, 'estado': estado,
                          'fecha_hora': self.ahora + timedelta(days=dias)})

    # eventos ------------------------------------------------------------------------------------------------
    def _eventos(self, loja, u, r):
        eventos = {}
        for clave, nombre, ruta, organizador, tipo, dias, horas, km, cupo, costo, estado in [
            ('10k', '10K Ciudad de Loja', r['malecon'], 'Club Gacelas', 'CARRERA', 30, 3, 10, 300, 15, 'ABIERTO'),
            ('trail', 'Trail Podocarpus', r['huayco'], 'Corredores del Podocarpus', 'TRAIL', 45, 5, 21, 150, 25,
             'ABIERTO'),
            ('caminata', 'Caminata familiar Jipiro', r['jipiro'], 'Municipio de Loja', 'CAMINATA', -10, 2, 3.2,
             500, 0, 'FINALIZADO'),
        ]:
            inicio = (self.ahora + timedelta(days=dias)).replace(hour=7, minute=0, second=0, microsecond=0)
            eventos[clave] = Evento.objects.update_or_create(
                nombre=nombre,
                defaults={'ciudad': loja, 'ruta': ruta, 'organizador': organizador, 'tipo': tipo,
                          'fecha_inicio': inicio, 'fecha_fin': inicio + timedelta(hours=horas),
                          'distancia_km': km, 'cupo': cupo, 'costo': costo, 'estado': estado})[0]

        # Inscripciones solo en eventos abiertos y con cupo libre.
        for evento, usuario, categoria in [(eventos['10k'], u['ana'], '10K'), (eventos['10k'], u['maria'], '5K'),
                                           (eventos['10k'], u['carlos'], 'Máster'),
                                           (eventos['trail'], u['luis'], '21K')]:
            Inscripcion.objects.get_or_create(evento=evento, usuario=usuario, defaults={'categoria': categoria})

    # publicidad ---------------------------------------------------------------------------------------------
    def _publicidad(self):
        hoy = self.hoy
        anunciantes = {
            nombre: Anunciante.objects.update_or_create(
                nombre=nombre, defaults={'ruc': ruc, 'correo': correo, 'telefono': telefono})[0]
            for nombre, ruc, correo, telefono in [
                ('Deportes Loja', '1105555555001', 'ventas@deportesloja.ec', '072570000'),
                ('Hidratación Andina', '1106666666001', 'contacto@hidratacionandina.ec', '0991112233'),
            ]
        }
        for anunciante, nombre, espacio, desde, hasta in [
            ('Deportes Loja', 'Zapatillas de temporada', 'RUTAS', 0, 60),
            ('Deportes Loja', 'Inscripciones 10K', 'EVENTOS', 0, 30),
            ('Hidratación Andina', 'Bebida isotónica', 'INICIO', -10, 20),
        ]:
            Campana.objects.update_or_create(
                anunciante=anunciantes[anunciante], nombre=nombre,
                defaults={'espacio': espacio, 'fecha_inicio': hoy + timedelta(days=desde),
                          'fecha_fin': hoy + timedelta(days=hasta)})
