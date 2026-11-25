/**
 * Modelos de la API RUNCTY (Django REST). Los nombres de campo son los del esquema OpenAPI
 * (/api/schema/). Fechas: 'AAAA-MM-DD'; horas: 'HH:MM[:SS]'; fecha-hora: ISO 8601.
 * Los campos `*_nombre` y los calculados son de solo lectura.
 */

/** Respuesta paginada de Django REST Framework. */
export interface Pagina<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Toda entidad de la API tiene un id numérico. */
export interface ConId {
  id: number;
}

export type NivelSeguridad = 'Alto' | 'Medio' | 'Bajo';

// ---------- RF-01, RF-02: usuarios ----------

export interface Rol extends ConId {
  nombre: string;
  descripcion: string;
  permisos: string;
}

export type NivelUsuario = 'PRINCIPIANTE' | 'INTERMEDIO' | 'AVANZADO';

export interface Usuario extends ConId {
  nombre: string;
  apellido: string;
  correo: string;
  fecha_nacimiento: string;
  ciudad: number;
  ciudad_nombre: string;
  rol: number;
  rol_nombre: string;
  nivel: NivelUsuario;
  acepta_terminos: boolean;
  activo: boolean;
  creado: string;
}

export type Objetivo = 'SALUD' | 'BAJAR_PESO' | 'PREPARAR_CARRERA' | 'MEJORAR_RITMO' | 'SOCIALIZAR';

export interface PerfilDeportivo extends ConId {
  usuario: number;
  usuario_nombre: string;
  peso_kg: number;
  estatura_cm: number;
  objetivo: Objetivo;
  km_semanales: number;
  ritmo_objetivo_min_km: number | null;
}

export interface Preferencia extends ConId {
  usuario: number;
  usuario_nombre: string;
  notificaciones: boolean;
  tema: 'CLARO' | 'OSCURO';
  tamano_letra: 'NORMAL' | 'GRANDE';
  unidad_distancia: 'KM' | 'MI';
  compartir_ubicacion: boolean;
}

// ---------- RF-04: ciudades ----------

export interface Ciudad extends ConId {
  nombre: string;
  provincia: string;
  pais: string;
  activa: boolean;
  total_zonas: number;
  creada: string;
}

export interface Zona extends ConId {
  ciudad: number;
  ciudad_nombre: string;
  nombre: string;
  tipo: 'URBANA' | 'RURAL' | 'PARQUE';
  descripcion: string;
}

// ---------- RF-05, RF-06: rutas ----------

/** Índice de seguridad de una ruta en una franja horaria (calculado por el backend). */
export interface SeguridadFranja {
  franja: number;
  franja_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  puntaje: number;
  nivel: NivelSeguridad;
  tramo_critico: string | null;
  factores: string[];
}

export interface Ruta extends ConId {
  ciudad: number;
  ciudad_nombre: string;
  nombre: string;
  descripcion: string;
  distancia_km: number;
  dificultad: 'FACIL' | 'MEDIA' | 'DIFICIL';
  superficie: 'ASFALTO' | 'TIERRA' | 'MIXTA';
  activa: boolean;
  seguridad: SeguridadFranja[];
  nivel_seguridad: NivelSeguridad | null;
  creada: string;
}

export interface Tramo extends ConId {
  ruta: number;
  ruta_nombre: string;
  orden: number;
  nombre: string;
  distancia_km: number;
  zona: number | null;
  zona_nombre: string;
}

export interface PuntoApoyo extends ConId {
  ruta: number;
  ruta_nombre: string;
  nombre: string;
  tipo: 'COMERCIO_ABIERTO' | 'PUESTO_POLICIAL' | 'CENTRO_SALUD' | 'LUGAR_CONCURRIDO';
  latitud: number;
  longitud: number;
  horario: string;
}

export interface SenderoResguardado extends ConId {
  ruta: number;
  ruta_nombre: string;
  institucion: string;
  dias: string;
  hora_inicio: string;
  hora_fin: string;
  activo: boolean;
}

// ---------- RF-07, RF-08, RF-09: seguridad ----------

export interface FranjaHoraria extends ConId {
  ruta: number;
  ruta_nombre: string;
  nombre: string;
  hora_inicio: string;
  hora_fin: string;
}

export type Severidad = 'BAJA' | 'MEDIA' | 'ALTA';

export interface FactorRiesgo extends ConId {
  tramo: number;
  tramo_nombre: string;
  franja: number;
  franja_nombre: string;
  tipo: 'ILUMINACION' | 'DELINCUENCIA' | 'TRAFICO' | 'TERRENO' | 'PERROS' | 'SOLEDAD' | 'OTRO';
  severidad: Severidad;
  descripcion: string;
  activo: boolean;
}

export interface AlertaZona extends ConId {
  zona: number;
  zona_nombre: string;
  titulo: string;
  descripcion: string;
  nivel: 'INFORMATIVA' | 'PRECAUCION' | 'PELIGRO';
  fecha_inicio: string;
  fecha_fin: string | null;
  activa: boolean;
}

export interface FuenteInformacion extends ConId {
  nombre: string;
  tipo: 'POLICIA' | 'MUNICIPIO' | 'CLUB' | 'COMUNIDAD' | 'ADMINISTRADOR';
  confiabilidad: number;
  contacto: string;
}

export interface Incidente extends ConId {
  zona: number;
  zona_nombre: string;
  ruta: number | null;
  fuente: number | null;
  tipo: 'ROBO' | 'ASALTO' | 'ACOSO' | 'ACCIDENTE' | 'OTRO';
  descripcion: string;
  fecha: string;
  latitud: number | null;
  longitud: number | null;
}

/** Ruta sugerida al crear una solicitud de ruta segura, ordenada por seguridad. */
export interface RutaRecomendada {
  ruta: number;
  nombre: string;
  distancia_km: number;
  franja: number;
  franja_nombre: string;
  hora_inicio: string;
  hora_fin: string;
  puntaje: number;
  nivel: NivelSeguridad;
  tramo_critico: string | null;
  factores: string[];
}

export interface SolicitudRutaSegura extends ConId {
  usuario: number;
  ciudad: number;
  ciudad_nombre: string;
  hora: string;
  distancia_max_km: number | null;
  creada: string;
  rutas_recomendadas: RutaRecomendada[];
}

// ---------- RF-03, RF-15, RF-16: seguridad personal ----------

export interface ContactoConfianza extends ConId {
  usuario: number;
  usuario_nombre: string;
  nombre: string;
  telefono: string;
  correo: string;
  parentesco: string;
}

export interface AlertaPanico extends ConId {
  usuario: number;
  usuario_nombre: string;
  latitud: number;
  longitud: number;
  mensaje: string;
  estado: 'ACTIVA' | 'ATENDIDA' | 'CANCELADA';
  contactos_notificados: number;
  creada: string;
  atendida_en: string | null;
}

export interface UbicacionCompartida extends ConId {
  usuario: number;
  usuario_nombre: string;
  contacto: number;
  contacto_nombre: string;
  latitud: number;
  longitud: number;
  inicio: string;
  fin: string | null;
  activa: boolean;
}

// ---------- RF-12, RF-13: entrenamiento ----------

export interface Entrenamiento extends ConId {
  usuario: number;
  usuario_nombre: string;
  ruta: number | null;
  ruta_nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  distancia_km: number;
  duracion_min: number;
  ritmo_min_km: number;
  calorias: number | null;
  puntos_gps: unknown;
  notas: string;
}

export type TipoObjetivo = 'DISTANCIA' | 'TIEMPO' | 'FRECUENCIA';

export interface Meta extends ConId {
  usuario: number;
  usuario_nombre: string;
  tipo: TipoObjetivo;
  valor_objetivo: number;
  periodo: 'SEMANAL' | 'MENSUAL';
  fecha_inicio: string;
  fecha_fin: string;
  cumplida: boolean;
}

// ---------- RF-10, RF-14, RF-17, RF-18, RF-22: comunidad ----------

export interface Favorita extends ConId {
  usuario: number;
  ruta: number;
  ruta_nombre: string;
  creada: string;
}

export interface Valoracion extends ConId {
  usuario: number;
  usuario_nombre: string;
  ruta: number;
  ruta_nombre: string;
  seguridad: number;
  iluminacion: number;
  afluencia: number;
  promedio: number;
  comentario: string;
  creada: string;
}

export interface Reto extends ConId {
  creador: number;
  creador_nombre: string;
  retado: number;
  retado_nombre: string;
  titulo: string;
  tipo: TipoObjetivo;
  valor_objetivo: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado: 'PENDIENTE' | 'ACEPTADO' | 'RECHAZADO' | 'FINALIZADO';
}

/** `usuario` es de solo escritura: se envía al crear y nunca se devuelve. */
export interface ReporteComunitario extends ConId {
  usuario?: number;
  ruta: number | null;
  ruta_nombre: string;
  zona: number | null;
  zona_nombre: string;
  tipo: 'INSEGURIDAD' | 'ILUMINACION' | 'OBSTACULO' | 'OTRO';
  descripcion: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO' | 'RESUELTO';
  observacion: string;
  creado: string;
}

export interface Notificacion extends ConId {
  usuario: number;
  titulo: string;
  mensaje: string;
  tipo: 'ALERTA' | 'RETO' | 'CLUB' | 'EVENTO' | 'SISTEMA';
  leida: boolean;
  creada: string;
}

export interface SolicitudCompanero extends ConId {
  solicitante: number;
  solicitante_nombre: string;
  receptor: number;
  receptor_nombre: string;
  mensaje: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
  creada: string;
}

// ---------- RF-11, RF-19, RF-20, RF-21: clubes ----------

export interface Club extends ConId {
  nombre: string;
  ciudad: number;
  ciudad_nombre: string;
  representante: number | null;
  descripcion: string;
  correo: string;
  fecha_fundacion: string | null;
  activo: boolean;
  total_miembros: number;
}

export interface Membresia extends ConId {
  club: number;
  club_nombre: string;
  usuario: number;
  usuario_nombre: string;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'ACTIVA' | 'SUSPENDIDA';
  fecha_solicitud: string;
}

export interface RutaClub extends ConId {
  club: number;
  club_nombre: string;
  ruta: number;
  ruta_nombre: string;
  comentario: string;
  creada: string;
}

export interface PuntoEncuentro extends ConId {
  club: number;
  club_nombre: string;
  nombre: string;
  referencia: string;
  latitud: number;
  longitud: number;
}

export interface SalidaGrupal extends ConId {
  club: number;
  club_nombre: string;
  ruta: number;
  ruta_nombre: string;
  punto_encuentro: number | null;
  titulo: string;
  fecha_hora: string;
  cupo: number;
  estado: 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA';
}

// ---------- RF-23: eventos ----------

export interface Evento extends ConId {
  nombre: string;
  ciudad: number;
  ciudad_nombre: string;
  ruta: number | null;
  organizador: string;
  tipo: 'CARRERA' | 'CAMINATA' | 'TRAIL' | 'ENTRENAMIENTO';
  descripcion: string;
  fecha_inicio: string;
  fecha_fin: string;
  distancia_km: number;
  cupo: number;
  cupos_disponibles: number;
  costo: number;
  estado: 'ABIERTO' | 'CERRADO' | 'CANCELADO' | 'FINALIZADO';
}

export interface Inscripcion extends ConId {
  evento: number;
  evento_nombre: string;
  usuario: number;
  usuario_nombre: string;
  categoria: string;
  estado: 'CONFIRMADA' | 'CANCELADA';
  creada: string;
}

// ---------- RF-24: publicidad ----------

export interface Anunciante extends ConId {
  nombre: string;
  ruc: string;
  correo: string;
  telefono: string;
  activo: boolean;
}

export interface Campana extends ConId {
  anunciante: number;
  anunciante_nombre: string;
  nombre: string;
  espacio: 'INICIO' | 'RUTAS' | 'EVENTOS';
  imagen_url: string;
  enlace: string;
  fecha_inicio: string;
  fecha_fin: string;
  activa: boolean;
  vigente: boolean;
}
