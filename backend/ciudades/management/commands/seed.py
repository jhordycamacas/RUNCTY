"""Carga datos de ejemplo de Loja. Se puede ejecutar varias veces sin duplicar nada."""
from datetime import date, time, timedelta

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from ciudades.models import Ciudad, Zona
from clubes.models import Club, Membresia, PuntoEncuentro, RutaClub, SalidaGrupal
from comunidad.models import Favorita, Notificacion, ReporteComunitario, Valoracion
from entrenamiento.models import Entrenamiento, MetaPersonal
from eventos.models import Evento, Inscripcion
from publicidad.models import Anunciante, Campana
from rutas.models import PuntoApoyo, Ruta, SenderoResguardado, Tramo
from seguridad.models import AlertaZona, FactorRiesgo, FranjaHoraria, FuenteInformacion, Incidente
from seguridad_personal.models import ContactoConfianza
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
    help = 'Carga datos de ejemplo de Loja (roles, rutas, franjas, clubes, eventos, publicidad).'

    @transaction.atomic
    def handle(self, *args, **options):
        ahora = timezone.now()
        hoy = timezone.localdate()

        roles = {
            nombre: Rol.objects.update_or_create(nombre=nombre, defaults={'descripcion': descripcion})[0]
            for nombre, descripcion in [
                ('Corredor', 'Consulta rutas, registra entrenamientos y usa el botón de pánico.'),
                ('Administrador', 'Gestiona rutas, horarios, reportes y publicidad.'),
                ('Representante de club', 'Aporta rutas de su ciudad y apoya la revisión de reportes.'),
            ]
        }

        loja, _ = Ciudad.objects.update_or_create(nombre='Loja', defaults={'provincia': 'Loja'})
        zonas = {
            nombre: Zona.objects.update_or_create(ciudad=loja, nombre=nombre, defaults={'tipo': tipo})[0]
            for nombre, tipo in ZONAS
        }

        ana = self._usuario('ana.torres@runcty.ec', 'Ana', 'Torres', date(1997, 4, 12), loja,
                            roles['Corredor'], 'INTERMEDIO')
        luis = self._usuario('luis.jaramillo@runcty.ec', 'Luis', 'Jaramillo', date(1990, 9, 3), loja,
                             roles['Representante de club'], 'AVANZADO')
        self._usuario('admin@runcty.ec', 'Gabriela', 'Celi', date(1988, 1, 20), loja,
                      roles['Administrador'], 'INTERMEDIO')
        PerfilDeportivo.objects.update_or_create(
            usuario=ana, defaults={'peso_kg': 58, 'estatura_cm': 162, 'objetivo': 'PREPARAR_CARRERA',
                                   'km_semanales': 25, 'ritmo_objetivo_min_km': 6})
        Preferencia.objects.update_or_create(usuario=ana, defaults={'tema': 'CLARO'})
        ContactoConfianza.objects.update_or_create(
            usuario=ana, telefono='0991234567', defaults={'nombre': 'Rosa Torres', 'parentesco': 'Madre'})

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
        jipiro, tebaida, malecon = rutas[0], rutas[1], rutas[2]

        PuntoApoyo.objects.update_or_create(
            ruta=jipiro, nombre='UPC Jipiro',
            defaults={'tipo': 'PUESTO_POLICIAL', 'latitud': -3.9731, 'longitud': -79.2045, 'horario': '24 horas'})
        PuntoApoyo.objects.update_or_create(
            ruta=malecon, nombre='Hospital Isidro Ayora',
            defaults={'tipo': 'CENTRO_SALUD', 'latitud': -3.9930, 'longitud': -79.2040, 'horario': '24 horas'})
        SenderoResguardado.objects.update_or_create(
            ruta=tebaida, hora_inicio=time(5, 30),
            defaults={'hora_fin': time(7, 0), 'dias': 'Lunes a sábado', 'institucion': 'Policía Nacional'})

        policia, _ = FuenteInformacion.objects.update_or_create(
            nombre='Policía Nacional - Subzona Loja', defaults={'tipo': 'POLICIA', 'confiabilidad': 5})
        FuenteInformacion.objects.update_or_create(
            nombre='Club Gacelas', defaults={'tipo': 'CLUB', 'confiabilidad': 4})
        Incidente.objects.update_or_create(
            zona=zonas['Centro Histórico'], tipo='ROBO', descripcion='Robo de celular a un corredor.',
            defaults={'ruta': malecon, 'fuente': policia, 'fecha': ahora - timedelta(days=5)})
        AlertaZona.objects.update_or_create(
            zona=zonas['Zamora Huayco'], titulo='Tramo sin alumbrado',
            defaults={'nivel': 'PRECAUCION', 'fecha_inicio': ahora - timedelta(days=1),
                      'fecha_fin': ahora + timedelta(days=14)})

        Favorita.objects.get_or_create(usuario=ana, ruta=jipiro)
        Valoracion.objects.update_or_create(
            usuario=ana, ruta=jipiro, defaults={'seguridad': 5, 'iluminacion': 4, 'afluencia': 5})
        ReporteComunitario.objects.get_or_create(
            usuario=ana, ruta=malecon, tipo='ILUMINACION',
            defaults={'descripcion': 'Postes apagados cerca del mercado.', 'estado': 'APROBADO'})
        Notificacion.objects.get_or_create(
            usuario=ana, titulo='Bienvenida a RUNCTY', defaults={'mensaje': 'Ya puedes consultar rutas seguras.'})

        inicio_entreno = ahora - timedelta(days=1, hours=2)
        Entrenamiento.objects.get_or_create(
            usuario=ana, ruta=jipiro, notas='Entrenamiento de ejemplo',
            defaults={'fecha_inicio': inicio_entreno, 'fecha_fin': inicio_entreno + timedelta(minutes=20),
                      'distancia_km': 3.2,
                      'puntos_gps': [{'lat': -3.9731, 'lng': -79.2045}, {'lat': -3.9705, 'lng': -79.2030}]})
        MetaPersonal.objects.get_or_create(
            usuario=ana, tipo='DISTANCIA', periodo='SEMANAL',
            defaults={'valor_objetivo': 25, 'fecha_inicio': hoy, 'fecha_fin': hoy + timedelta(days=7)})

        gacelas, _ = Club.objects.update_or_create(
            nombre='Club Gacelas Loja',
            defaults={'ciudad': loja, 'representante': luis, 'correo': 'gacelas@runcty.ec',
                      'descripcion': 'Club de corredores de Loja.'})
        Membresia.objects.update_or_create(club=gacelas, usuario=ana, defaults={'estado': 'ACTIVA'})
        RutaClub.objects.update_or_create(club=gacelas, ruta=tebaida, defaults={'comentario': 'Plana e iluminada.'})
        punto, _ = PuntoEncuentro.objects.update_or_create(
            club=gacelas, nombre='Puerta de la Ciudad',
            defaults={'latitud': -3.9930, 'longitud': -79.2045, 'referencia': 'Junto al arco'})
        SalidaGrupal.objects.update_or_create(
            club=gacelas, titulo='Fondo del sábado',
            defaults={'ruta': tebaida, 'punto_encuentro': punto, 'cupo': 30,
                      'fecha_hora': ahora + timedelta(days=4)})

        inicio_evento = (ahora + timedelta(days=30)).replace(hour=7, minute=0, second=0, microsecond=0)
        evento, _ = Evento.objects.update_or_create(
            nombre='10K Ciudad de Loja',
            defaults={'ciudad': loja, 'ruta': malecon, 'organizador': 'Club Gacelas', 'tipo': 'CARRERA',
                      'fecha_inicio': inicio_evento, 'fecha_fin': inicio_evento + timedelta(hours=3),
                      'distancia_km': 10, 'cupo': 300})
        Inscripcion.objects.get_or_create(evento=evento, usuario=ana, defaults={'categoria': '10K'})

        anunciante, _ = Anunciante.objects.update_or_create(
            nombre='Deportes Loja', defaults={'ruc': '1105555555001', 'correo': 'ventas@deportesloja.ec'})
        Campana.objects.update_or_create(
            anunciante=anunciante, nombre='Zapatillas de temporada',
            defaults={'espacio': 'RUTAS', 'fecha_inicio': hoy, 'fecha_fin': hoy + timedelta(days=60)})

        self.stdout.write(self.style.SUCCESS(
            f'Datos de Loja listos: {Ruta.objects.count()} rutas, {Usuario.objects.count()} usuarios.'))

    @staticmethod
    def _usuario(correo, nombre, apellido, nacimiento, ciudad, rol, nivel):
        return Usuario.objects.update_or_create(
            correo=correo,
            defaults={'nombre': nombre, 'apellido': apellido, 'fecha_nacimiento': nacimiento,
                      'ciudad': ciudad, 'rol': rol, 'nivel': nivel, 'acepta_terminos': True})[0]
