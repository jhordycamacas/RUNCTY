import { Routes } from '@angular/router';

type Cargador = NonNullable<Routes[number]['loadComponent']>;

/** Las cuatro rutas de una entidad: lista, nuevo, detalle y editar (carga diferida). */
function crud(endpoint: string, lista: Cargador, form: Cargador, detalle: Cargador): Routes {
  return [
    { path: endpoint, loadComponent: lista },
    { path: `${endpoint}/nuevo`, loadComponent: form },
    { path: `${endpoint}/:id`, loadComponent: detalle },
    { path: `${endpoint}/:id/editar`, loadComponent: form },
  ];
}

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  {
    path: 'inicio',
    loadComponent: () => import('./paginas/inicio.page').then((m) => m.InicioPage),
  },
  ...crud(
    'roles',
    () => import('./paginas/usuarios/rol-lista.page').then((m) => m.RolListaPage),
    () => import('./paginas/usuarios/rol-form.page').then((m) => m.RolFormPage),
    () => import('./paginas/usuarios/rol-detalle.page').then((m) => m.RolDetallePage),
  ),
  ...crud(
    'usuarios',
    () => import('./paginas/usuarios/usuario-lista.page').then((m) => m.UsuarioListaPage),
    () => import('./paginas/usuarios/usuario-form.page').then((m) => m.UsuarioFormPage),
    () => import('./paginas/usuarios/usuario-detalle.page').then((m) => m.UsuarioDetallePage),
  ),
  ...crud(
    'perfiles-deportivos',
    () => import('./paginas/usuarios/perfil-deportivo-lista.page').then((m) => m.PerfilDeportivoListaPage),
    () => import('./paginas/usuarios/perfil-deportivo-form.page').then((m) => m.PerfilDeportivoFormPage),
    () => import('./paginas/usuarios/perfil-deportivo-detalle.page').then((m) => m.PerfilDeportivoDetallePage),
  ),
  ...crud(
    'preferencias',
    () => import('./paginas/usuarios/preferencia-lista.page').then((m) => m.PreferenciaListaPage),
    () => import('./paginas/usuarios/preferencia-form.page').then((m) => m.PreferenciaFormPage),
    () => import('./paginas/usuarios/preferencia-detalle.page').then((m) => m.PreferenciaDetallePage),
  ),
  ...crud(
    'ciudades',
    () => import('./paginas/ciudades/ciudad-lista.page').then((m) => m.CiudadListaPage),
    () => import('./paginas/ciudades/ciudad-form.page').then((m) => m.CiudadFormPage),
    () => import('./paginas/ciudades/ciudad-detalle.page').then((m) => m.CiudadDetallePage),
  ),
  ...crud(
    'zonas',
    () => import('./paginas/ciudades/zona-lista.page').then((m) => m.ZonaListaPage),
    () => import('./paginas/ciudades/zona-form.page').then((m) => m.ZonaFormPage),
    () => import('./paginas/ciudades/zona-detalle.page').then((m) => m.ZonaDetallePage),
  ),
  ...crud(
    'rutas',
    () => import('./paginas/rutas/ruta-lista.page').then((m) => m.RutaListaPage),
    () => import('./paginas/rutas/ruta-form.page').then((m) => m.RutaFormPage),
    () => import('./paginas/rutas/ruta-detalle.page').then((m) => m.RutaDetallePage),
  ),
  ...crud(
    'tramos',
    () => import('./paginas/rutas/tramo-lista.page').then((m) => m.TramoListaPage),
    () => import('./paginas/rutas/tramo-form.page').then((m) => m.TramoFormPage),
    () => import('./paginas/rutas/tramo-detalle.page').then((m) => m.TramoDetallePage),
  ),
  ...crud(
    'puntos-apoyo',
    () => import('./paginas/rutas/punto-apoyo-lista.page').then((m) => m.PuntoApoyoListaPage),
    () => import('./paginas/rutas/punto-apoyo-form.page').then((m) => m.PuntoApoyoFormPage),
    () => import('./paginas/rutas/punto-apoyo-detalle.page').then((m) => m.PuntoApoyoDetallePage),
  ),
  ...crud(
    'senderos-resguardados',
    () => import('./paginas/rutas/sendero-resguardado-lista.page').then((m) => m.SenderoResguardadoListaPage),
    () => import('./paginas/rutas/sendero-resguardado-form.page').then((m) => m.SenderoResguardadoFormPage),
    () => import('./paginas/rutas/sendero-resguardado-detalle.page').then((m) => m.SenderoResguardadoDetallePage),
  ),
  ...crud(
    'franjas-horarias',
    () => import('./paginas/seguridad/franja-horaria-lista.page').then((m) => m.FranjaHorariaListaPage),
    () => import('./paginas/seguridad/franja-horaria-form.page').then((m) => m.FranjaHorariaFormPage),
    () => import('./paginas/seguridad/franja-horaria-detalle.page').then((m) => m.FranjaHorariaDetallePage),
  ),
  ...crud(
    'factores-riesgo',
    () => import('./paginas/seguridad/factor-riesgo-lista.page').then((m) => m.FactorRiesgoListaPage),
    () => import('./paginas/seguridad/factor-riesgo-form.page').then((m) => m.FactorRiesgoFormPage),
    () => import('./paginas/seguridad/factor-riesgo-detalle.page').then((m) => m.FactorRiesgoDetallePage),
  ),
  ...crud(
    'alertas-zona',
    () => import('./paginas/seguridad/alerta-zona-lista.page').then((m) => m.AlertaZonaListaPage),
    () => import('./paginas/seguridad/alerta-zona-form.page').then((m) => m.AlertaZonaFormPage),
    () => import('./paginas/seguridad/alerta-zona-detalle.page').then((m) => m.AlertaZonaDetallePage),
  ),
  ...crud(
    'fuentes-informacion',
    () => import('./paginas/seguridad/fuente-informacion-lista.page').then((m) => m.FuenteInformacionListaPage),
    () => import('./paginas/seguridad/fuente-informacion-form.page').then((m) => m.FuenteInformacionFormPage),
    () => import('./paginas/seguridad/fuente-informacion-detalle.page').then((m) => m.FuenteInformacionDetallePage),
  ),
  ...crud(
    'incidentes',
    () => import('./paginas/seguridad/incidente-lista.page').then((m) => m.IncidenteListaPage),
    () => import('./paginas/seguridad/incidente-form.page').then((m) => m.IncidenteFormPage),
    () => import('./paginas/seguridad/incidente-detalle.page').then((m) => m.IncidenteDetallePage),
  ),
  ...crud(
    'solicitudes-ruta-segura',
    () => import('./paginas/seguridad/solicitud-ruta-segura-lista.page').then((m) => m.SolicitudRutaSeguraListaPage),
    () => import('./paginas/seguridad/solicitud-ruta-segura-form.page').then((m) => m.SolicitudRutaSeguraFormPage),
    () => import('./paginas/seguridad/solicitud-ruta-segura-detalle.page').then((m) => m.SolicitudRutaSeguraDetallePage),
  ),
  ...crud(
    'contactos-confianza',
    () => import('./paginas/seguridad-personal/contacto-confianza-lista.page').then((m) => m.ContactoConfianzaListaPage),
    () => import('./paginas/seguridad-personal/contacto-confianza-form.page').then((m) => m.ContactoConfianzaFormPage),
    () => import('./paginas/seguridad-personal/contacto-confianza-detalle.page').then((m) => m.ContactoConfianzaDetallePage),
  ),
  ...crud(
    'alertas-panico',
    () => import('./paginas/seguridad-personal/alerta-panico-lista.page').then((m) => m.AlertaPanicoListaPage),
    () => import('./paginas/seguridad-personal/alerta-panico-form.page').then((m) => m.AlertaPanicoFormPage),
    () => import('./paginas/seguridad-personal/alerta-panico-detalle.page').then((m) => m.AlertaPanicoDetallePage),
  ),
  ...crud(
    'ubicaciones-compartidas',
    () => import('./paginas/seguridad-personal/ubicacion-compartida-lista.page').then((m) => m.UbicacionCompartidaListaPage),
    () => import('./paginas/seguridad-personal/ubicacion-compartida-form.page').then((m) => m.UbicacionCompartidaFormPage),
    () => import('./paginas/seguridad-personal/ubicacion-compartida-detalle.page').then((m) => m.UbicacionCompartidaDetallePage),
  ),
  ...crud(
    'entrenamientos',
    () => import('./paginas/entrenamiento/entrenamiento-lista.page').then((m) => m.EntrenamientoListaPage),
    () => import('./paginas/entrenamiento/entrenamiento-form.page').then((m) => m.EntrenamientoFormPage),
    () => import('./paginas/entrenamiento/entrenamiento-detalle.page').then((m) => m.EntrenamientoDetallePage),
  ),
  ...crud(
    'metas',
    () => import('./paginas/entrenamiento/meta-lista.page').then((m) => m.MetaListaPage),
    () => import('./paginas/entrenamiento/meta-form.page').then((m) => m.MetaFormPage),
    () => import('./paginas/entrenamiento/meta-detalle.page').then((m) => m.MetaDetallePage),
  ),
  ...crud(
    'favoritas',
    () => import('./paginas/comunidad/favorita-lista.page').then((m) => m.FavoritaListaPage),
    () => import('./paginas/comunidad/favorita-form.page').then((m) => m.FavoritaFormPage),
    () => import('./paginas/comunidad/favorita-detalle.page').then((m) => m.FavoritaDetallePage),
  ),
  ...crud(
    'valoraciones',
    () => import('./paginas/comunidad/valoracion-lista.page').then((m) => m.ValoracionListaPage),
    () => import('./paginas/comunidad/valoracion-form.page').then((m) => m.ValoracionFormPage),
    () => import('./paginas/comunidad/valoracion-detalle.page').then((m) => m.ValoracionDetallePage),
  ),
  ...crud(
    'retos',
    () => import('./paginas/comunidad/reto-lista.page').then((m) => m.RetoListaPage),
    () => import('./paginas/comunidad/reto-form.page').then((m) => m.RetoFormPage),
    () => import('./paginas/comunidad/reto-detalle.page').then((m) => m.RetoDetallePage),
  ),
  ...crud(
    'reportes-comunitarios',
    () => import('./paginas/comunidad/reporte-comunitario-lista.page').then((m) => m.ReporteComunitarioListaPage),
    () => import('./paginas/comunidad/reporte-comunitario-form.page').then((m) => m.ReporteComunitarioFormPage),
    () => import('./paginas/comunidad/reporte-comunitario-detalle.page').then((m) => m.ReporteComunitarioDetallePage),
  ),
  ...crud(
    'notificaciones',
    () => import('./paginas/comunidad/notificacion-lista.page').then((m) => m.NotificacionListaPage),
    () => import('./paginas/comunidad/notificacion-form.page').then((m) => m.NotificacionFormPage),
    () => import('./paginas/comunidad/notificacion-detalle.page').then((m) => m.NotificacionDetallePage),
  ),
  ...crud(
    'solicitudes-companero',
    () => import('./paginas/comunidad/solicitud-companero-lista.page').then((m) => m.SolicitudCompaneroListaPage),
    () => import('./paginas/comunidad/solicitud-companero-form.page').then((m) => m.SolicitudCompaneroFormPage),
    () => import('./paginas/comunidad/solicitud-companero-detalle.page').then((m) => m.SolicitudCompaneroDetallePage),
  ),
  ...crud(
    'clubes',
    () => import('./paginas/clubes/club-lista.page').then((m) => m.ClubListaPage),
    () => import('./paginas/clubes/club-form.page').then((m) => m.ClubFormPage),
    () => import('./paginas/clubes/club-detalle.page').then((m) => m.ClubDetallePage),
  ),
  ...crud(
    'membresias',
    () => import('./paginas/clubes/membresia-lista.page').then((m) => m.MembresiaListaPage),
    () => import('./paginas/clubes/membresia-form.page').then((m) => m.MembresiaFormPage),
    () => import('./paginas/clubes/membresia-detalle.page').then((m) => m.MembresiaDetallePage),
  ),
  ...crud(
    'rutas-club',
    () => import('./paginas/clubes/ruta-club-lista.page').then((m) => m.RutaClubListaPage),
    () => import('./paginas/clubes/ruta-club-form.page').then((m) => m.RutaClubFormPage),
    () => import('./paginas/clubes/ruta-club-detalle.page').then((m) => m.RutaClubDetallePage),
  ),
  ...crud(
    'puntos-encuentro',
    () => import('./paginas/clubes/punto-encuentro-lista.page').then((m) => m.PuntoEncuentroListaPage),
    () => import('./paginas/clubes/punto-encuentro-form.page').then((m) => m.PuntoEncuentroFormPage),
    () => import('./paginas/clubes/punto-encuentro-detalle.page').then((m) => m.PuntoEncuentroDetallePage),
  ),
  ...crud(
    'salidas-grupales',
    () => import('./paginas/clubes/salida-grupal-lista.page').then((m) => m.SalidaGrupalListaPage),
    () => import('./paginas/clubes/salida-grupal-form.page').then((m) => m.SalidaGrupalFormPage),
    () => import('./paginas/clubes/salida-grupal-detalle.page').then((m) => m.SalidaGrupalDetallePage),
  ),
  ...crud(
    'eventos',
    () => import('./paginas/eventos/evento-lista.page').then((m) => m.EventoListaPage),
    () => import('./paginas/eventos/evento-form.page').then((m) => m.EventoFormPage),
    () => import('./paginas/eventos/evento-detalle.page').then((m) => m.EventoDetallePage),
  ),
  ...crud(
    'inscripciones',
    () => import('./paginas/eventos/inscripcion-lista.page').then((m) => m.InscripcionListaPage),
    () => import('./paginas/eventos/inscripcion-form.page').then((m) => m.InscripcionFormPage),
    () => import('./paginas/eventos/inscripcion-detalle.page').then((m) => m.InscripcionDetallePage),
  ),
  ...crud(
    'anunciantes',
    () => import('./paginas/publicidad/anunciante-lista.page').then((m) => m.AnuncianteListaPage),
    () => import('./paginas/publicidad/anunciante-form.page').then((m) => m.AnuncianteFormPage),
    () => import('./paginas/publicidad/anunciante-detalle.page').then((m) => m.AnuncianteDetallePage),
  ),
  ...crud(
    'campanas',
    () => import('./paginas/publicidad/campana-lista.page').then((m) => m.CampanaListaPage),
    () => import('./paginas/publicidad/campana-form.page').then((m) => m.CampanaFormPage),
    () => import('./paginas/publicidad/campana-detalle.page').then((m) => m.CampanaDetallePage),
  ),
  { path: '**', redirectTo: 'inicio' },
];
