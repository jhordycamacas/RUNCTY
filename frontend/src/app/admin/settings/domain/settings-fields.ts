import { SettingKey } from '../../../core/settings/system-settings';

export interface SettingField {
  key: SettingKey;
  label: string;
  kind: 'integer' | 'decimal' | 'text';
  /** Bounds of a number, in the units the form shows. */
  min?: number;
  max?: number;
  /** The form shows `stored * scale` (the tolerance is stored as 0..1 and typed as a percentage). */
  scale?: number;
  hint?: string;
}

export interface SettingGroup {
  id: string;
  title: string;
  description: string;
  fields: readonly SettingField[];
}

const integer = (key: SettingKey, label: string, min: number, max: number, hint?: string): SettingField => ({
  key,
  label,
  kind: 'integer',
  min,
  max,
  hint,
});

/** The parameters grouped as the page shows them; the bounds are the ones the API enforces. */
export const SETTING_GROUPS: readonly SettingGroup[] = [
  {
    id: 'safety',
    title: 'Índice de seguridad',
    description:
      'Cuántos puntos resta cada factor de riesgo o incidente según su severidad y desde qué valor una ruta se considera de nivel Alto o Medio. Cambiarlos recalcula todas las rutas.',
    fields: [
      integer('penaltyLow', 'Penalización baja (puntos)', 0, 100),
      integer('penaltyMedium', 'Penalización media (puntos)', 0, 100),
      integer('penaltyHigh', 'Penalización alta (puntos)', 0, 100),
      integer('thresholdHigh', 'Umbral del nivel Alto', 1, 100),
      integer('thresholdMedium', 'Umbral del nivel Medio', 1, 100),
    ],
  },
  {
    id: 'incidents',
    title: 'Incidentes',
    description:
      'Cuánto tiempo cuenta un incidente en el índice y qué margen se aplica alrededor de su hora. Cambiarlos recalcula todas las rutas.',
    fields: [
      integer('incidentWindowDays', 'Ventana de incidentes (días)', 1, 3650),
      integer('incidentMarginMinutes', 'Margen alrededor de la hora (minutos)', 0, 720),
    ],
  },
  {
    id: 'locale',
    title: 'Zona horaria y país',
    description:
      'El reloj local que usan las franjas, las alertas y los incidentes, y el país que se asigna a las ciudades nuevas. Cambiar la zona horaria recalcula todas las rutas.',
    fields: [
      { key: 'timeZone', label: 'Zona horaria', kind: 'text', hint: 'Ejemplo: America/Guayaquil' },
      { key: 'countryCode', label: 'País', kind: 'text', hint: 'Dos letras, por ejemplo EC' },
    ],
  },
  {
    id: 'radii',
    title: 'Radios de búsqueda y alertas',
    description: 'Qué tan lejos se busca y hasta dónde llega una alerta de zona.',
    fields: [
      integer('nearbyRadiusM', 'Radio de «cerca de la ruta» (metros)', 1, 10000),
      integer('maxSearchRadiusM', 'Radio máximo de búsqueda (metros)', 1, 200000),
      integer('maxAlertRadiusM', 'Radio máximo de una alerta (metros)', 1, 50000),
    ],
  },
  {
    id: 'route-limits',
    title: 'Límites de rutas',
    description: 'Los máximos que se aceptan al crear o editar una ruta, sus tramos y sus franjas.',
    fields: [
      integer('maxTimeSlotsPerRoute', 'Franjas por ruta', 1, 48),
      integer('maxSegmentsPerRoute', 'Tramos por ruta', 1, 100),
      integer('maxRiskFactorsPerSegment', 'Factores de riesgo por tramo', 1, 100),
      integer('routeNameMaxLength', 'Largo del nombre (caracteres)', 10, 200),
      integer('routeDescriptionMaxLength', 'Largo de la descripción (caracteres)', 50, 2000),
      integer('routeMaxDistanceKm', 'Distancia máxima de una ruta (km)', 1, 1000),
      integer('routeMaxElevationM', 'Desnivel máximo de una ruta (m)', 1, 20000),
      integer('segmentMaxPoints', 'Puntos por tramo', 2, 2000),
    ],
  },
  {
    id: 'sport-profile',
    title: 'Perfil deportivo',
    description:
      'Los rangos que acepta el perfil del corredor para su ritmo y su distancia preferida. Se aplican al guardar el perfil; los perfiles ya guardados no cambian.',
    fields: [
      integer('paceMinSecPerKm', 'Ritmo mínimo (segundos por km)', 30, 3600),
      integer('paceMaxSecPerKm', 'Ritmo máximo (segundos por km)', 30, 7200),
      { key: 'distanceMinKm', label: 'Distancia mínima (km)', kind: 'decimal', min: 0.1, max: 500 },
      { key: 'distanceMaxKm', label: 'Distancia máxima (km)', kind: 'decimal', min: 0.1, max: 1000 },
    ],
  },
  {
    id: 'safe-routes',
    title: 'Rutas seguras',
    description: 'Cuánto puede alejarse de la distancia pedida una ruta segura y cuál es la distancia máxima que se puede pedir.',
    fields: [
      {
        key: 'safeRouteDistanceTolerance',
        label: 'Tolerancia de distancia (%)',
        kind: 'decimal',
        min: 1,
        max: 100,
        scale: 100,
        hint: 'Por ejemplo, 20 acepta rutas de ±20 % de la distancia pedida',
      },
      integer('safeRouteMaxDistanceKm', 'Distancia máxima pedida (km)', 1, 1000),
    ],
  },
];

export const SETTING_FIELDS: ReadonlyMap<SettingKey, SettingField> = new Map(
  SETTING_GROUPS.flatMap((group) => group.fields).map((field) => [field.key, field]),
);
