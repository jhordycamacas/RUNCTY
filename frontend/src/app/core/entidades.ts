/**
 * Metadatos por entidad, derivados del esquema OpenAPI del backend (/api/schema/).
 * Los componentes genéricos de `paginas/compartido` arman listas, formularios y detalles con esto.
 */

export type TipoCampo =
  | 'text' | 'email' | 'url' | 'textarea' | 'number' | 'integer' | 'date' | 'time' | 'datetime'
  | 'select' | 'fk' | 'checkbox' | 'json' | 'nivel';

export interface Opcion {
  valor: string;
  etiqueta: string;
}

export interface Campo {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  /** select: valores permitidos (choices de Django). */
  opciones?: Opcion[];
  /** fk: endpoint de donde salen las opciones; el nombre se lee de `<campo>_nombre`. */
  endpoint?: string;
  min?: number;
  max?: number;
  maxLength?: number;
  /** Calculado por el backend: solo se muestra en el detalle. */
  soloLectura?: boolean;
  /** Solo se envía al crear (campo write-only del backend). */
  soloCrear?: boolean;
  ayuda?: string;
}

/** Enlace a una lista hija filtrada por este registro (ej.: ruta → tramos?ruta=5). */
export interface Hijo {
  endpoint: string;
  filtro: string;
}

export type ClaveModulo =
  | 'usuarios' | 'ciudades' | 'rutas' | 'seguridad' | 'seguridad-personal' | 'entrenamiento'
  | 'comunidad' | 'clubes' | 'eventos' | 'publicidad';

export interface Modulo {
  clave: ClaveModulo;
  titulo: string;
  icono: string;
}

export interface Entidad {
  endpoint: string;
  titulo: string;
  plural: string;
  modulo: ClaveModulo;
  icono: string;
  campos: Campo[];
  /** Campos que se muestran como resumen en cada fila del listado. */
  columnas: string[];
  /** Filtros de la API que se ofrecen en el listado (deben existir en `campos`). */
  filtros: string[];
  hijos?: Hijo[];
  /** Texto principal de un registro (por defecto nombre, titulo o "#id"). */
  etiqueta?: (registro: Record<string, unknown>) => string;
  /** Editar con PATCH (cuando un campo obligatorio es write-only y no vuelve del backend). */
  editarConPatch?: boolean;
}

// ---------- Ayudantes para declarar campos ----------

type Extra = Partial<Omit<Campo, 'nombre' | 'etiqueta' | 'tipo'>>;

const campo = (tipo: TipoCampo) => (nombre: string, etiqueta: string, extra: Extra = {}): Campo => ({
  nombre, etiqueta, tipo, ...extra,
});
const texto = campo('text');
const area = campo('textarea');
const correo = campo('email');
const url = campo('url');
const numero = campo('number');
const entero = campo('integer');
const fecha = campo('date');
const hora = campo('time');
const fechaHora = campo('datetime');
const sino = campo('checkbox');
const json = campo('json');
const nivel = campo('nivel');

function opciones(nombre: string, etiqueta: string, lista: Opcion[], extra: Extra = {}): Campo {
  return { nombre, etiqueta, tipo: 'select', opciones: lista, ...extra };
}

function fk(nombre: string, etiqueta: string, endpoint: string, extra: Extra = {}): Campo {
  return { nombre, etiqueta, tipo: 'fk', endpoint, ...extra };
}

const calculado = (c: Campo): Campo => ({ ...c, soloLectura: true });
const req: Extra = { requerido: true };

/** Lista de opciones a partir de pares [valor, etiqueta]. */
const op = (...pares: [string, string][]): Opcion[] => pares.map(([valor, etiqueta]) => ({ valor, etiqueta }));

const LAT: Extra = { requerido: true, min: -90, max: 90 };
const LNG: Extra = { requerido: true, min: -180, max: 180 };
const PUNTAJE: Extra = { requerido: true, min: 1, max: 5 };

// ---------- Choices (enums del esquema OpenAPI) ----------

export const OPCIONES = {
  nivelUsuario: op(['PRINCIPIANTE', 'Principiante'], ['INTERMEDIO', 'Intermedio'], ['AVANZADO', 'Avanzado']),
  objetivo: op(
    ['SALUD', 'Salud'], ['BAJAR_PESO', 'Bajar de peso'], ['PREPARAR_CARRERA', 'Preparar una carrera'],
    ['MEJORAR_RITMO', 'Mejorar el ritmo'], ['SOCIALIZAR', 'Socializar'],
  ),
  tema: op(['CLARO', 'Claro'], ['OSCURO', 'Oscuro']),
  tamanoLetra: op(['NORMAL', 'Normal'], ['GRANDE', 'Grande']),
  unidadDistancia: op(['KM', 'Kilómetros'], ['MI', 'Millas']),
  tipoZona: op(['URBANA', 'Urbana'], ['RURAL', 'Rural'], ['PARQUE', 'Parque']),
  dificultad: op(['FACIL', 'Fácil'], ['MEDIA', 'Media'], ['DIFICIL', 'Difícil']),
  superficie: op(['ASFALTO', 'Asfalto'], ['TIERRA', 'Tierra'], ['MIXTA', 'Mixta']),
  tipoPuntoApoyo: op(
    ['COMERCIO_ABIERTO', 'Comercio abierto'], ['PUESTO_POLICIAL', 'Puesto policial'],
    ['CENTRO_SALUD', 'Centro de salud'], ['LUGAR_CONCURRIDO', 'Lugar concurrido'],
  ),
  tipoFactor: op(
    ['ILUMINACION', 'Poca iluminación'], ['DELINCUENCIA', 'Delincuencia'], ['TRAFICO', 'Tráfico vehicular'],
    ['TERRENO', 'Terreno en mal estado'], ['PERROS', 'Perros sueltos'], ['SOLEDAD', 'Zona solitaria'],
    ['OTRO', 'Otro'],
  ),
  severidad: op(['BAJA', 'Baja'], ['MEDIA', 'Media'], ['ALTA', 'Alta']),
  nivelAlerta: op(['INFORMATIVA', 'Informativa'], ['PRECAUCION', 'Precaución'], ['PELIGRO', 'Peligro']),
  tipoFuente: op(
    ['POLICIA', 'Policía'], ['MUNICIPIO', 'Municipio'], ['CLUB', 'Club'], ['COMUNIDAD', 'Comunidad'],
    ['ADMINISTRADOR', 'Administrador'],
  ),
  tipoIncidente: op(['ROBO', 'Robo'], ['ASALTO', 'Asalto'], ['ACOSO', 'Acoso'], ['ACCIDENTE', 'Accidente'], ['OTRO', 'Otro']),
  estadoPanico: op(['ACTIVA', 'Activa'], ['ATENDIDA', 'Atendida'], ['CANCELADA', 'Cancelada']),
  tipoObjetivo: op(['DISTANCIA', 'Distancia (km)'], ['TIEMPO', 'Tiempo (min)'], ['FRECUENCIA', 'Frecuencia (sesiones)']),
  periodo: op(['SEMANAL', 'Semanal'], ['MENSUAL', 'Mensual']),
  estadoReto: op(['PENDIENTE', 'Pendiente'], ['ACEPTADO', 'Aceptado'], ['RECHAZADO', 'Rechazado'], ['FINALIZADO', 'Finalizado']),
  tipoReporte: op(
    ['INSEGURIDAD', 'Inseguridad'], ['ILUMINACION', 'Falta de iluminación'], ['OBSTACULO', 'Obstáculo en la vía'],
    ['OTRO', 'Otro'],
  ),
  estadoReporte: op(['PENDIENTE', 'Pendiente'], ['APROBADO', 'Aprobado'], ['RECHAZADO', 'Rechazado'], ['RESUELTO', 'Resuelto']),
  tipoNotificacion: op(
    ['ALERTA', 'Alerta de seguridad'], ['RETO', 'Reto'], ['CLUB', 'Club'], ['EVENTO', 'Evento'], ['SISTEMA', 'Sistema'],
  ),
  estadoSolicitud: op(['PENDIENTE', 'Pendiente'], ['ACEPTADA', 'Aceptada'], ['RECHAZADA', 'Rechazada']),
  estadoMembresia: op(['PENDIENTE', 'Pendiente'], ['ACEPTADA', 'Aceptada'], ['ACTIVA', 'Activa'], ['SUSPENDIDA', 'Suspendida']),
  estadoSalida: op(['PROGRAMADA', 'Programada'], ['REALIZADA', 'Realizada'], ['CANCELADA', 'Cancelada']),
  tipoEvento: op(['CARRERA', 'Carrera'], ['CAMINATA', 'Caminata'], ['TRAIL', 'Trail'], ['ENTRENAMIENTO', 'Entrenamiento abierto']),
  estadoEvento: op(
    ['ABIERTO', 'Inscripciones abiertas'], ['CERRADO', 'Inscripciones cerradas'], ['CANCELADO', 'Cancelado'],
    ['FINALIZADO', 'Finalizado'],
  ),
  estadoInscripcion: op(['CONFIRMADA', 'Confirmada'], ['CANCELADA', 'Cancelada']),
  espacio: op(['INICIO', 'Pantalla de inicio'], ['RUTAS', 'Listado de rutas'], ['EVENTOS', 'Listado de eventos']),
};

// ---------- Módulos del menú ----------

export const MODULOS: Modulo[] = [
  { clave: 'usuarios', titulo: 'Usuarios', icono: 'person-circle' },
  { clave: 'ciudades', titulo: 'Ciudades', icono: 'business' },
  { clave: 'rutas', titulo: 'Rutas', icono: 'trail-sign' },
  { clave: 'seguridad', titulo: 'Seguridad de rutas', icono: 'shield-checkmark' },
  { clave: 'seguridad-personal', titulo: 'Seguridad personal', icono: 'shield' },
  { clave: 'entrenamiento', titulo: 'Entrenamiento', icono: 'stopwatch' },
  { clave: 'comunidad', titulo: 'Comunidad', icono: 'chatbubbles' },
  { clave: 'clubes', titulo: 'Clubes', icono: 'people-circle' },
  { clave: 'eventos', titulo: 'Eventos', icono: 'calendar' },
  { clave: 'publicidad', titulo: 'Publicidad', icono: 'megaphone' },
];

const nombreCompleto = (r: Record<string, unknown>) => `${r['nombre'] ?? ''} ${r['apellido'] ?? ''}`.trim();

// ---------- Entidades ----------

export const ENTIDADES = {
  // RF-01, RF-02
  roles: {
    endpoint: 'roles', titulo: 'Rol', plural: 'Roles', modulo: 'usuarios', icono: 'key',
    campos: [texto('nombre', 'Nombre', { ...req, maxLength: 50 }), area('descripcion', 'Descripción'), area('permisos', 'Permisos')],
    columnas: ['descripcion'], filtros: [],
    hijos: [{ endpoint: 'usuarios', filtro: 'rol' }],
  },
  usuarios: {
    endpoint: 'usuarios', titulo: 'Usuario', plural: 'Usuarios', modulo: 'usuarios', icono: 'person',
    campos: [
      texto('nombre', 'Nombre', { ...req, maxLength: 80 }),
      texto('apellido', 'Apellido', { ...req, maxLength: 80 }),
      correo('correo', 'Correo', { ...req, maxLength: 254 }),
      fecha('fecha_nacimiento', 'Fecha de nacimiento', req),
      fk('ciudad', 'Ciudad', 'ciudades', req),
      fk('rol', 'Rol', 'roles', req),
      opciones('nivel', 'Nivel', OPCIONES.nivelUsuario),
      sino('acepta_terminos', 'Acepta términos y condiciones'),
      sino('activo', 'Activo'),
      calculado(fechaHora('creado', 'Creado')),
    ],
    columnas: ['correo', 'ciudad', 'nivel'], filtros: ['ciudad', 'rol', 'nivel', 'activo'],
    etiqueta: nombreCompleto,
    hijos: [
      { endpoint: 'perfiles-deportivos', filtro: 'usuario' }, { endpoint: 'preferencias', filtro: 'usuario' },
      { endpoint: 'contactos-confianza', filtro: 'usuario' }, { endpoint: 'alertas-panico', filtro: 'usuario' },
      { endpoint: 'entrenamientos', filtro: 'usuario' }, { endpoint: 'metas', filtro: 'usuario' },
      { endpoint: 'notificaciones', filtro: 'usuario' }, { endpoint: 'membresias', filtro: 'usuario' },
      { endpoint: 'inscripciones', filtro: 'usuario' },
    ],
  },
  'perfiles-deportivos': {
    endpoint: 'perfiles-deportivos', titulo: 'Perfil deportivo', plural: 'Perfiles deportivos', modulo: 'usuarios',
    icono: 'fitness',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      numero('peso_kg', 'Peso (kg)', { ...req, min: 25, max: 250 }),
      entero('estatura_cm', 'Estatura (cm)', { ...req, min: 100, max: 230 }),
      opciones('objetivo', 'Objetivo', OPCIONES.objetivo),
      numero('km_semanales', 'Km semanales', { min: 0, max: 300 }),
      numero('ritmo_objetivo_min_km', 'Ritmo objetivo (min/km)', { min: 2, max: 20 }),
    ],
    columnas: ['objetivo', 'km_semanales'], filtros: ['usuario', 'objetivo'],
    etiqueta: (r) => `Perfil de ${r['usuario_nombre']}`,
  },
  preferencias: {
    endpoint: 'preferencias', titulo: 'Preferencia', plural: 'Preferencias', modulo: 'usuarios', icono: 'settings',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      sino('notificaciones', 'Recibir notificaciones'),
      opciones('tema', 'Tema', OPCIONES.tema),
      opciones('tamano_letra', 'Tamaño de letra', OPCIONES.tamanoLetra),
      opciones('unidad_distancia', 'Unidad de distancia', OPCIONES.unidadDistancia),
      sino('compartir_ubicacion', 'Compartir ubicación'),
    ],
    columnas: ['tema', 'unidad_distancia'], filtros: ['usuario'],
    etiqueta: (r) => `Preferencias de ${r['usuario_nombre']}`,
  },
  // RF-04
  ciudades: {
    endpoint: 'ciudades', titulo: 'Ciudad', plural: 'Ciudades', modulo: 'ciudades', icono: 'business',
    campos: [
      texto('nombre', 'Nombre', { ...req, maxLength: 100 }),
      texto('provincia', 'Provincia', { ...req, maxLength: 100 }),
      texto('pais', 'País', { maxLength: 60 }),
      sino('activa', 'Activa'),
      calculado(entero('total_zonas', 'Total de zonas')),
      calculado(fechaHora('creada', 'Creada')),
    ],
    columnas: ['provincia', 'total_zonas'], filtros: ['activa'],
    hijos: [
      { endpoint: 'zonas', filtro: 'ciudad' }, { endpoint: 'rutas', filtro: 'ciudad' },
      { endpoint: 'usuarios', filtro: 'ciudad' }, { endpoint: 'clubes', filtro: 'ciudad' },
      { endpoint: 'eventos', filtro: 'ciudad' }, { endpoint: 'alertas-zona', filtro: 'zona__ciudad' },
    ],
  },
  zonas: {
    endpoint: 'zonas', titulo: 'Zona', plural: 'Zonas', modulo: 'ciudades', icono: 'map',
    campos: [
      fk('ciudad', 'Ciudad', 'ciudades', req),
      texto('nombre', 'Nombre', { ...req, maxLength: 100 }),
      opciones('tipo', 'Tipo', OPCIONES.tipoZona),
      area('descripcion', 'Descripción'),
    ],
    columnas: ['ciudad', 'tipo'], filtros: ['ciudad', 'tipo'],
    hijos: [
      { endpoint: 'tramos', filtro: 'zona' }, { endpoint: 'alertas-zona', filtro: 'zona' },
      { endpoint: 'incidentes', filtro: 'zona' }, { endpoint: 'reportes-comunitarios', filtro: 'zona' },
    ],
  },
  // RF-05, RF-06
  rutas: {
    endpoint: 'rutas', titulo: 'Ruta', plural: 'Rutas', modulo: 'rutas', icono: 'trail-sign',
    campos: [
      fk('ciudad', 'Ciudad', 'ciudades', req),
      texto('nombre', 'Nombre', { ...req, maxLength: 120 }),
      area('descripcion', 'Descripción'),
      numero('distancia_km', 'Distancia (km)', { ...req, min: 0.1, max: 100 }),
      opciones('dificultad', 'Dificultad', OPCIONES.dificultad),
      opciones('superficie', 'Superficie', OPCIONES.superficie),
      sino('activa', 'Activa'),
      calculado(nivel('nivel_seguridad', 'Nivel de seguridad')),
      calculado(fechaHora('creada', 'Creada')),
    ],
    columnas: ['ciudad', 'distancia_km', 'nivel_seguridad'], filtros: ['ciudad', 'dificultad', 'superficie', 'activa'],
    hijos: [
      { endpoint: 'tramos', filtro: 'ruta' }, { endpoint: 'franjas-horarias', filtro: 'ruta' },
      { endpoint: 'factores-riesgo', filtro: 'tramo__ruta' }, { endpoint: 'puntos-apoyo', filtro: 'ruta' },
      { endpoint: 'senderos-resguardados', filtro: 'ruta' }, { endpoint: 'incidentes', filtro: 'ruta' },
      { endpoint: 'valoraciones', filtro: 'ruta' }, { endpoint: 'favoritas', filtro: 'ruta' },
      { endpoint: 'entrenamientos', filtro: 'ruta' }, { endpoint: 'reportes-comunitarios', filtro: 'ruta' },
      { endpoint: 'rutas-club', filtro: 'ruta' }, { endpoint: 'salidas-grupales', filtro: 'ruta' },
    ],
  },
  tramos: {
    endpoint: 'tramos', titulo: 'Tramo', plural: 'Tramos', modulo: 'rutas', icono: 'git-commit',
    campos: [
      fk('ruta', 'Ruta', 'rutas', req),
      entero('orden', 'Orden', { ...req, min: 1, max: 65535 }),
      texto('nombre', 'Nombre', { ...req, maxLength: 120 }),
      numero('distancia_km', 'Distancia (km)', { ...req, min: 0.1, max: 100 }),
      fk('zona', 'Zona', 'zonas'),
    ],
    columnas: ['ruta', 'orden', 'distancia_km'], filtros: ['ruta', 'zona'],
    hijos: [{ endpoint: 'factores-riesgo', filtro: 'tramo' }],
  },
  'puntos-apoyo': {
    endpoint: 'puntos-apoyo', titulo: 'Punto de apoyo', plural: 'Puntos de apoyo', modulo: 'rutas', icono: 'medkit',
    campos: [
      fk('ruta', 'Ruta', 'rutas', req),
      texto('nombre', 'Nombre', { ...req, maxLength: 120 }),
      opciones('tipo', 'Tipo', OPCIONES.tipoPuntoApoyo, req),
      numero('latitud', 'Latitud', LAT),
      numero('longitud', 'Longitud', LNG),
      texto('horario', 'Horario', { maxLength: 100 }),
    ],
    columnas: ['ruta', 'tipo'], filtros: ['ruta', 'tipo'],
  },
  'senderos-resguardados': {
    endpoint: 'senderos-resguardados', titulo: 'Sendero resguardado', plural: 'Senderos resguardados', modulo: 'rutas',
    icono: 'shield-half',
    campos: [
      fk('ruta', 'Ruta', 'rutas', req),
      texto('institucion', 'Institución', { maxLength: 120 }),
      texto('dias', 'Días', { ...req, maxLength: 100, ayuda: 'Ej.: Lunes a viernes' }),
      hora('hora_inicio', 'Hora de inicio', req),
      hora('hora_fin', 'Hora de fin', req),
      sino('activo', 'Activo'),
    ],
    columnas: ['dias', 'hora_inicio', 'hora_fin'], filtros: ['ruta', 'activo'],
    etiqueta: (r) => `${r['ruta_nombre']} · ${r['institucion'] || 'Resguardo'}`,
  },
  // RF-07, RF-08, RF-09
  'franjas-horarias': {
    endpoint: 'franjas-horarias', titulo: 'Franja horaria', plural: 'Franjas horarias', modulo: 'seguridad', icono: 'time',
    campos: [
      fk('ruta', 'Ruta', 'rutas', req),
      texto('nombre', 'Nombre', { ...req, maxLength: 60 }),
      hora('hora_inicio', 'Hora de inicio', req),
      hora('hora_fin', 'Hora de fin', req),
    ],
    columnas: ['ruta', 'hora_inicio', 'hora_fin'], filtros: ['ruta'],
    hijos: [{ endpoint: 'factores-riesgo', filtro: 'franja' }],
  },
  'factores-riesgo': {
    endpoint: 'factores-riesgo', titulo: 'Factor de riesgo', plural: 'Factores de riesgo', modulo: 'seguridad',
    icono: 'warning',
    campos: [
      fk('tramo', 'Tramo', 'tramos', req),
      fk('franja', 'Franja horaria', 'franjas-horarias', req),
      opciones('tipo', 'Tipo', OPCIONES.tipoFactor, req),
      opciones('severidad', 'Severidad', OPCIONES.severidad),
      texto('descripcion', 'Descripción', { maxLength: 255 }),
      sino('activo', 'Activo'),
    ],
    columnas: ['tramo', 'franja', 'severidad'], filtros: ['tramo', 'franja', 'tipo', 'severidad', 'activo'],
    etiqueta: (r) => `${OPCIONES.tipoFactor.find((o) => o.valor === r['tipo'])?.etiqueta ?? r['tipo']}`,
  },
  'alertas-zona': {
    endpoint: 'alertas-zona', titulo: 'Alerta de zona', plural: 'Alertas de zona', modulo: 'seguridad',
    icono: 'alert-circle',
    campos: [
      fk('zona', 'Zona', 'zonas', req),
      texto('titulo', 'Título', { ...req, maxLength: 120 }),
      area('descripcion', 'Descripción'),
      opciones('nivel', 'Nivel', OPCIONES.nivelAlerta),
      fechaHora('fecha_inicio', 'Inicio', req),
      fechaHora('fecha_fin', 'Fin'),
      sino('activa', 'Activa'),
    ],
    columnas: ['zona', 'nivel', 'fecha_inicio'], filtros: ['zona', 'nivel', 'activa'],
  },
  'fuentes-informacion': {
    endpoint: 'fuentes-informacion', titulo: 'Fuente de información', plural: 'Fuentes de información',
    modulo: 'seguridad', icono: 'information-circle',
    campos: [
      texto('nombre', 'Nombre', { ...req, maxLength: 120 }),
      opciones('tipo', 'Tipo', OPCIONES.tipoFuente, req),
      entero('confiabilidad', 'Confiabilidad (1 a 5)', { min: 1, max: 5 }),
      texto('contacto', 'Contacto', { maxLength: 120 }),
    ],
    columnas: ['tipo', 'confiabilidad'], filtros: ['tipo'],
    hijos: [{ endpoint: 'incidentes', filtro: 'fuente' }],
  },
  incidentes: {
    endpoint: 'incidentes', titulo: 'Incidente', plural: 'Incidentes', modulo: 'seguridad', icono: 'alert',
    campos: [
      fk('zona', 'Zona', 'zonas', req),
      fk('ruta', 'Ruta', 'rutas'),
      fk('fuente', 'Fuente', 'fuentes-informacion'),
      opciones('tipo', 'Tipo', OPCIONES.tipoIncidente, req),
      area('descripcion', 'Descripción', req),
      fechaHora('fecha', 'Fecha y hora', req),
      numero('latitud', 'Latitud', { min: -90, max: 90 }),
      numero('longitud', 'Longitud', { min: -180, max: 180 }),
    ],
    columnas: ['zona', 'fecha'], filtros: ['zona', 'ruta', 'fuente', 'tipo'],
    etiqueta: (r) => `${OPCIONES.tipoIncidente.find((o) => o.valor === r['tipo'])?.etiqueta ?? r['tipo']} en ${r['zona_nombre']}`,
  },
  'solicitudes-ruta-segura': {
    endpoint: 'solicitudes-ruta-segura', titulo: 'Solicitud de ruta segura', plural: 'Solicitudes de ruta segura',
    modulo: 'seguridad', icono: 'navigate',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      fk('ciudad', 'Ciudad', 'ciudades', req),
      hora('hora', 'Hora en que saldrá a correr', req),
      numero('distancia_max_km', 'Distancia máxima (km)', { min: 0.1, max: 100 }),
      calculado(fechaHora('creada', 'Creada')),
    ],
    columnas: ['ciudad', 'hora'], filtros: ['usuario', 'ciudad'],
    etiqueta: (r) => `Solicitud #${r['id']} · ${r['ciudad_nombre']} ${String(r['hora'] ?? '').slice(0, 5)}`,
  },
  // RF-03, RF-15, RF-16
  'contactos-confianza': {
    endpoint: 'contactos-confianza', titulo: 'Contacto de confianza', plural: 'Contactos de confianza',
    modulo: 'seguridad-personal', icono: 'call',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      texto('nombre', 'Nombre', { ...req, maxLength: 120 }),
      texto('telefono', 'Teléfono', { ...req, maxLength: 16, ayuda: 'Ej.: +593991234567' }),
      correo('correo', 'Correo', { maxLength: 254 }),
      texto('parentesco', 'Parentesco', { maxLength: 60 }),
    ],
    columnas: ['usuario', 'telefono'], filtros: ['usuario'],
    hijos: [{ endpoint: 'ubicaciones-compartidas', filtro: 'contacto' }],
  },
  'alertas-panico': {
    endpoint: 'alertas-panico', titulo: 'Alerta de pánico', plural: 'Alertas de pánico', modulo: 'seguridad-personal',
    icono: 'megaphone',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      numero('latitud', 'Latitud', LAT),
      numero('longitud', 'Longitud', LNG),
      texto('mensaje', 'Mensaje', { maxLength: 255 }),
      opciones('estado', 'Estado', OPCIONES.estadoPanico),
      calculado(entero('contactos_notificados', 'Contactos notificados')),
      calculado(fechaHora('creada', 'Creada')),
      calculado(fechaHora('atendida_en', 'Atendida en')),
    ],
    columnas: ['estado', 'creada'], filtros: ['usuario', 'estado'],
    etiqueta: (r) => `Alerta de ${r['usuario_nombre']}`,
  },
  'ubicaciones-compartidas': {
    endpoint: 'ubicaciones-compartidas', titulo: 'Ubicación compartida', plural: 'Ubicaciones compartidas',
    modulo: 'seguridad-personal', icono: 'locate',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      fk('contacto', 'Contacto', 'contactos-confianza', req),
      numero('latitud', 'Latitud', LAT),
      numero('longitud', 'Longitud', LNG),
      fechaHora('fin', 'Fin'),
      sino('activa', 'Activa'),
      calculado(fechaHora('inicio', 'Inicio')),
    ],
    columnas: ['contacto', 'activa'], filtros: ['usuario', 'contacto', 'activa'],
    etiqueta: (r) => `${r['usuario_nombre']} → ${r['contacto_nombre']}`,
  },
  // RF-12, RF-13
  entrenamientos: {
    endpoint: 'entrenamientos', titulo: 'Entrenamiento', plural: 'Entrenamientos', modulo: 'entrenamiento',
    icono: 'stopwatch',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      fk('ruta', 'Ruta', 'rutas'),
      fechaHora('fecha_inicio', 'Inicio', req),
      fechaHora('fecha_fin', 'Fin', req),
      numero('distancia_km', 'Distancia (km)', { ...req, min: 0.01, max: 300 }),
      entero('calorias', 'Calorías', { min: 0, max: 20000 }),
      json('puntos_gps', 'Puntos GPS (JSON)', { ayuda: 'Ej.: [{"lat": -3.99, "lng": -79.2}]' }),
      texto('notas', 'Notas', { maxLength: 255 }),
      calculado(numero('duracion_min', 'Duración (min)')),
      calculado(numero('ritmo_min_km', 'Ritmo (min/km)')),
    ],
    columnas: ['fecha_inicio', 'distancia_km', 'ritmo_min_km'], filtros: ['usuario', 'ruta'],
    etiqueta: (r) => `${r['usuario_nombre']} · ${r['distancia_km']} km`,
  },
  metas: {
    endpoint: 'metas', titulo: 'Meta', plural: 'Metas', modulo: 'entrenamiento', icono: 'flag',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      opciones('tipo', 'Tipo', OPCIONES.tipoObjetivo, req),
      numero('valor_objetivo', 'Valor objetivo', { ...req, min: 0.1, max: 10000 }),
      opciones('periodo', 'Periodo', OPCIONES.periodo),
      fecha('fecha_inicio', 'Inicio', req),
      fecha('fecha_fin', 'Fin', req),
      sino('cumplida', 'Cumplida'),
    ],
    columnas: ['tipo', 'valor_objetivo', 'periodo'], filtros: ['usuario', 'tipo', 'periodo', 'cumplida'],
    etiqueta: (r) => `Meta de ${r['usuario_nombre']}`,
  },
  // RF-10, RF-14, RF-17, RF-18, RF-22
  favoritas: {
    endpoint: 'favoritas', titulo: 'Favorita', plural: 'Favoritas', modulo: 'comunidad', icono: 'heart',
    campos: [fk('usuario', 'Usuario', 'usuarios', req), fk('ruta', 'Ruta', 'rutas', req), calculado(fechaHora('creada', 'Creada'))],
    columnas: ['creada'], filtros: ['usuario', 'ruta'],
    etiqueta: (r) => String(r['ruta_nombre'] ?? ''),
  },
  valoraciones: {
    endpoint: 'valoraciones', titulo: 'Valoración', plural: 'Valoraciones', modulo: 'comunidad', icono: 'star',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      fk('ruta', 'Ruta', 'rutas', req),
      entero('seguridad', 'Seguridad (1 a 5)', PUNTAJE),
      entero('iluminacion', 'Iluminación (1 a 5)', PUNTAJE),
      entero('afluencia', 'Afluencia (1 a 5)', PUNTAJE),
      texto('comentario', 'Comentario', { maxLength: 255 }),
      calculado(numero('promedio', 'Promedio')),
      calculado(fechaHora('creada', 'Creada')),
    ],
    columnas: ['usuario', 'promedio'], filtros: ['usuario', 'ruta'],
    etiqueta: (r) => String(r['ruta_nombre'] ?? ''),
  },
  retos: {
    endpoint: 'retos', titulo: 'Reto', plural: 'Retos', modulo: 'comunidad', icono: 'trophy',
    campos: [
      fk('creador', 'Creador', 'usuarios', req),
      fk('retado', 'Retado', 'usuarios', req),
      texto('titulo', 'Título', { ...req, maxLength: 120 }),
      opciones('tipo', 'Tipo', OPCIONES.tipoObjetivo, req),
      numero('valor_objetivo', 'Valor objetivo', { ...req, min: 0.1, max: 10000 }),
      fecha('fecha_inicio', 'Inicio', req),
      fecha('fecha_fin', 'Fin', req),
      opciones('estado', 'Estado', OPCIONES.estadoReto),
    ],
    columnas: ['creador', 'retado', 'estado'], filtros: ['creador', 'retado', 'tipo', 'estado'],
  },
  'reportes-comunitarios': {
    endpoint: 'reportes-comunitarios', titulo: 'Reporte comunitario', plural: 'Reportes comunitarios',
    modulo: 'comunidad', icono: 'chatbubbles', editarConPatch: true,
    campos: [
      fk('usuario', 'Usuario que reporta', 'usuarios', { ...req, soloCrear: true }),
      fk('ruta', 'Ruta', 'rutas'),
      fk('zona', 'Zona', 'zonas'),
      opciones('tipo', 'Tipo', OPCIONES.tipoReporte, req),
      area('descripcion', 'Descripción', req),
      opciones('estado', 'Estado', OPCIONES.estadoReporte),
      texto('observacion', 'Observación del moderador', { maxLength: 255 }),
      calculado(fechaHora('creado', 'Creado')),
    ],
    columnas: ['estado', 'creado'], filtros: ['ruta', 'zona', 'tipo', 'estado'],
    etiqueta: (r) => `${OPCIONES.tipoReporte.find((o) => o.valor === r['tipo'])?.etiqueta ?? r['tipo']} · ${r['ruta_nombre'] || r['zona_nombre'] || ''}`,
  },
  notificaciones: {
    endpoint: 'notificaciones', titulo: 'Notificación', plural: 'Notificaciones', modulo: 'comunidad',
    icono: 'notifications',
    campos: [
      fk('usuario', 'Usuario', 'usuarios', req),
      texto('titulo', 'Título', { ...req, maxLength: 120 }),
      area('mensaje', 'Mensaje', req),
      opciones('tipo', 'Tipo', OPCIONES.tipoNotificacion),
      sino('leida', 'Leída'),
      calculado(fechaHora('creada', 'Creada')),
    ],
    columnas: ['tipo', 'leida'], filtros: ['usuario', 'tipo', 'leida'],
  },
  'solicitudes-companero': {
    endpoint: 'solicitudes-companero', titulo: 'Solicitud de compañero', plural: 'Solicitudes de compañero',
    modulo: 'comunidad', icono: 'people',
    campos: [
      fk('solicitante', 'Solicitante', 'usuarios', req),
      fk('receptor', 'Receptor', 'usuarios', req),
      texto('mensaje', 'Mensaje', { maxLength: 255 }),
      opciones('estado', 'Estado', OPCIONES.estadoSolicitud),
      calculado(fechaHora('creada', 'Creada')),
    ],
    columnas: ['estado', 'creada'], filtros: ['solicitante', 'receptor', 'estado'],
    etiqueta: (r) => `${r['solicitante_nombre']} → ${r['receptor_nombre']}`,
  },
  // RF-11, RF-19, RF-20, RF-21
  clubes: {
    endpoint: 'clubes', titulo: 'Club', plural: 'Clubes', modulo: 'clubes', icono: 'people-circle',
    campos: [
      texto('nombre', 'Nombre', { ...req, maxLength: 120 }),
      fk('ciudad', 'Ciudad', 'ciudades', req),
      fk('representante', 'Representante', 'usuarios'),
      area('descripcion', 'Descripción'),
      correo('correo', 'Correo', { maxLength: 254 }),
      fecha('fecha_fundacion', 'Fecha de fundación'),
      sino('activo', 'Activo'),
      calculado(entero('total_miembros', 'Total de miembros')),
    ],
    columnas: ['ciudad', 'total_miembros'], filtros: ['ciudad', 'activo'],
    hijos: [
      { endpoint: 'membresias', filtro: 'club' }, { endpoint: 'rutas-club', filtro: 'club' },
      { endpoint: 'puntos-encuentro', filtro: 'club' }, { endpoint: 'salidas-grupales', filtro: 'club' },
    ],
  },
  membresias: {
    endpoint: 'membresias', titulo: 'Membresía', plural: 'Membresías', modulo: 'clubes', icono: 'id-card',
    campos: [
      fk('club', 'Club', 'clubes', req),
      fk('usuario', 'Usuario', 'usuarios', req),
      opciones('estado', 'Estado', OPCIONES.estadoMembresia),
      calculado(fechaHora('fecha_solicitud', 'Fecha de solicitud')),
    ],
    columnas: ['club', 'estado'], filtros: ['club', 'usuario', 'estado'],
    etiqueta: (r) => String(r['usuario_nombre'] ?? ''),
  },
  'rutas-club': {
    endpoint: 'rutas-club', titulo: 'Ruta del club', plural: 'Rutas del club', modulo: 'clubes', icono: 'git-network',
    campos: [
      fk('club', 'Club', 'clubes', req),
      fk('ruta', 'Ruta', 'rutas', req),
      texto('comentario', 'Comentario', { maxLength: 255 }),
      calculado(fechaHora('creada', 'Creada')),
    ],
    columnas: ['club'], filtros: ['club', 'ruta'],
    etiqueta: (r) => String(r['ruta_nombre'] ?? ''),
  },
  'puntos-encuentro': {
    endpoint: 'puntos-encuentro', titulo: 'Punto de encuentro', plural: 'Puntos de encuentro', modulo: 'clubes',
    icono: 'pin',
    campos: [
      fk('club', 'Club', 'clubes', req),
      texto('nombre', 'Nombre', { ...req, maxLength: 120 }),
      texto('referencia', 'Referencia', { maxLength: 255 }),
      numero('latitud', 'Latitud', LAT),
      numero('longitud', 'Longitud', LNG),
    ],
    columnas: ['club', 'referencia'], filtros: ['club'],
  },
  'salidas-grupales': {
    endpoint: 'salidas-grupales', titulo: 'Salida grupal', plural: 'Salidas grupales', modulo: 'clubes', icono: 'walk',
    campos: [
      fk('club', 'Club', 'clubes', req),
      fk('ruta', 'Ruta', 'rutas', req),
      fk('punto_encuentro', 'Punto de encuentro', 'puntos-encuentro'),
      texto('titulo', 'Título', { ...req, maxLength: 120 }),
      fechaHora('fecha_hora', 'Fecha y hora', req),
      entero('cupo', 'Cupo', { ...req, min: 1, max: 500 }),
      opciones('estado', 'Estado', OPCIONES.estadoSalida),
    ],
    columnas: ['club', 'fecha_hora', 'estado'], filtros: ['club', 'ruta', 'estado'],
  },
  // RF-23
  eventos: {
    endpoint: 'eventos', titulo: 'Evento', plural: 'Eventos', modulo: 'eventos', icono: 'calendar',
    campos: [
      texto('nombre', 'Nombre', { ...req, maxLength: 150 }),
      fk('ciudad', 'Ciudad', 'ciudades', req),
      fk('ruta', 'Ruta', 'rutas'),
      texto('organizador', 'Organizador', { ...req, maxLength: 120 }),
      opciones('tipo', 'Tipo', OPCIONES.tipoEvento),
      area('descripcion', 'Descripción'),
      fechaHora('fecha_inicio', 'Inicio', req),
      fechaHora('fecha_fin', 'Fin', req),
      numero('distancia_km', 'Distancia (km)', { ...req, min: 0.1, max: 200 }),
      entero('cupo', 'Cupo', { ...req, min: 1, max: 50000 }),
      numero('costo', 'Costo (USD)', { min: 0, max: 100000 }),
      opciones('estado', 'Estado', OPCIONES.estadoEvento),
      calculado(entero('cupos_disponibles', 'Cupos disponibles')),
    ],
    columnas: ['ciudad', 'fecha_inicio', 'estado'], filtros: ['ciudad', 'tipo', 'estado'],
    hijos: [{ endpoint: 'inscripciones', filtro: 'evento' }],
  },
  inscripciones: {
    endpoint: 'inscripciones', titulo: 'Inscripción', plural: 'Inscripciones', modulo: 'eventos', icono: 'ticket',
    campos: [
      fk('evento', 'Evento', 'eventos', req),
      fk('usuario', 'Usuario', 'usuarios', req),
      texto('categoria', 'Categoría', { maxLength: 60 }),
      opciones('estado', 'Estado', OPCIONES.estadoInscripcion),
      calculado(fechaHora('creada', 'Creada')),
    ],
    columnas: ['evento', 'estado'], filtros: ['evento', 'usuario', 'estado'],
    etiqueta: (r) => String(r['usuario_nombre'] ?? ''),
  },
  // RF-24
  anunciantes: {
    endpoint: 'anunciantes', titulo: 'Anunciante', plural: 'Anunciantes', modulo: 'publicidad', icono: 'storefront',
    campos: [
      texto('nombre', 'Nombre', { ...req, maxLength: 120 }),
      texto('ruc', 'RUC', { ...req, maxLength: 13, ayuda: '13 dígitos' }),
      correo('correo', 'Correo', { ...req, maxLength: 254 }),
      texto('telefono', 'Teléfono', { maxLength: 16 }),
      sino('activo', 'Activo'),
    ],
    columnas: ['ruc', 'correo'], filtros: ['activo'],
    hijos: [{ endpoint: 'campanas', filtro: 'anunciante' }],
  },
  campanas: {
    endpoint: 'campanas', titulo: 'Campaña', plural: 'Campañas', modulo: 'publicidad', icono: 'images',
    campos: [
      fk('anunciante', 'Anunciante', 'anunciantes', req),
      texto('nombre', 'Nombre', { ...req, maxLength: 120 }),
      opciones('espacio', 'Espacio', OPCIONES.espacio),
      url('imagen_url', 'URL de la imagen', { maxLength: 200 }),
      url('enlace', 'Enlace', { maxLength: 200 }),
      fecha('fecha_inicio', 'Inicio', req),
      fecha('fecha_fin', 'Fin', req),
      sino('activa', 'Activa'),
      calculado(sino('vigente', 'Vigente hoy')),
    ],
    columnas: ['anunciante', 'espacio', 'vigente'], filtros: ['anunciante', 'espacio', 'activa'],
  },
} satisfies Record<string, Entidad>;

export type ClaveEntidad = keyof typeof ENTIDADES;

/** Metadatos de un endpoint, o undefined si no existe. */
export function entidadDe(endpoint: string): Entidad | undefined {
  return (ENTIDADES as Record<string, Entidad>)[endpoint];
}

/** Entidades de un módulo, en el orden declarado. */
export function entidadesDelModulo(modulo: ClaveModulo): Entidad[] {
  return (Object.values(ENTIDADES) as Entidad[]).filter((e) => e.modulo === modulo);
}

/** Texto principal de un registro para listas, títulos y selectores. */
export function etiquetaDe(entidad: Entidad | undefined, registro: Record<string, unknown>): string {
  const propia = entidad?.etiqueta?.(registro);
  if (propia) {
    return propia;
  }
  const nombre = registro['nombre'] ?? registro['titulo'];
  return nombre ? String(nombre) : `${entidad?.titulo ?? 'Registro'} #${registro['id']}`;
}
