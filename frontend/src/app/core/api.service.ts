import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { urlApi } from './api.config';
import { CrudService } from './crud.service';
import {
  AlertaPanico, AlertaZona, Anunciante, Campana, Ciudad, Club, ConId, ContactoConfianza,
  Entrenamiento, Evento, FactorRiesgo, Favorita, FranjaHoraria, FuenteInformacion, Incidente,
  Inscripcion, Membresia, Meta, Notificacion, PerfilDeportivo, Preferencia, PuntoApoyo,
  PuntoEncuentro, ReporteComunitario, Reto, Rol, Ruta, RutaClub, SalidaGrupal, SenderoResguardado,
  SolicitudCompanero, SolicitudRutaSegura, Tramo, UbicacionCompartida, Usuario, Valoracion, Zona,
} from './modelos';

/**
 * Registro tipado de servicios: un CrudService por entidad. Las páginas usan este servicio y
 * nunca llaman a HttpClient directamente.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = urlApi();
  private readonly servicios = new Map<string, CrudService<ConId>>();

  // Usuarios (RF-01, RF-02)
  readonly roles = this.recurso<Rol>('roles');
  readonly usuarios = this.recurso<Usuario>('usuarios');
  readonly perfilesDeportivos = this.recurso<PerfilDeportivo>('perfiles-deportivos');
  readonly preferencias = this.recurso<Preferencia>('preferencias');
  // Ciudades (RF-04)
  readonly ciudades = this.recurso<Ciudad>('ciudades');
  readonly zonas = this.recurso<Zona>('zonas');
  // Rutas (RF-05, RF-06)
  readonly rutas = this.recurso<Ruta>('rutas');
  readonly tramos = this.recurso<Tramo>('tramos');
  readonly puntosApoyo = this.recurso<PuntoApoyo>('puntos-apoyo');
  readonly senderosResguardados = this.recurso<SenderoResguardado>('senderos-resguardados');
  // Seguridad (RF-07, RF-08, RF-09)
  readonly franjasHorarias = this.recurso<FranjaHoraria>('franjas-horarias');
  readonly factoresRiesgo = this.recurso<FactorRiesgo>('factores-riesgo');
  readonly alertasZona = this.recurso<AlertaZona>('alertas-zona');
  readonly fuentesInformacion = this.recurso<FuenteInformacion>('fuentes-informacion');
  readonly incidentes = this.recurso<Incidente>('incidentes');
  readonly solicitudesRutaSegura = this.recurso<SolicitudRutaSegura>('solicitudes-ruta-segura');
  // Seguridad personal (RF-03, RF-15, RF-16)
  readonly contactosConfianza = this.recurso<ContactoConfianza>('contactos-confianza');
  readonly alertasPanico = this.recurso<AlertaPanico>('alertas-panico');
  readonly ubicacionesCompartidas = this.recurso<UbicacionCompartida>('ubicaciones-compartidas');
  // Entrenamiento (RF-12, RF-13)
  readonly entrenamientos = this.recurso<Entrenamiento>('entrenamientos');
  readonly metas = this.recurso<Meta>('metas');
  // Comunidad (RF-10, RF-14, RF-17, RF-18, RF-22)
  readonly favoritas = this.recurso<Favorita>('favoritas');
  readonly valoraciones = this.recurso<Valoracion>('valoraciones');
  readonly retos = this.recurso<Reto>('retos');
  readonly reportesComunitarios = this.recurso<ReporteComunitario>('reportes-comunitarios');
  readonly notificaciones = this.recurso<Notificacion>('notificaciones');
  readonly solicitudesCompanero = this.recurso<SolicitudCompanero>('solicitudes-companero');
  // Clubes (RF-11, RF-19, RF-20, RF-21)
  readonly clubes = this.recurso<Club>('clubes');
  readonly membresias = this.recurso<Membresia>('membresias');
  readonly rutasClub = this.recurso<RutaClub>('rutas-club');
  readonly puntosEncuentro = this.recurso<PuntoEncuentro>('puntos-encuentro');
  readonly salidasGrupales = this.recurso<SalidaGrupal>('salidas-grupales');
  // Eventos (RF-23)
  readonly eventos = this.recurso<Evento>('eventos');
  readonly inscripciones = this.recurso<Inscripcion>('inscripciones');
  // Publicidad (RF-24)
  readonly anunciantes = this.recurso<Anunciante>('anunciantes');
  readonly campanas = this.recurso<Campana>('campanas');

  /** Servicio CRUD de un endpoint (los componentes genéricos lo piden por nombre). */
  recurso<T extends ConId = ConId>(endpoint: string): CrudService<T> {
    let servicio = this.servicios.get(endpoint);
    if (!servicio) {
      servicio = new CrudService<ConId>(this.http, this.base, endpoint);
      this.servicios.set(endpoint, servicio);
    }
    return servicio as unknown as CrudService<T>;
  }
}
