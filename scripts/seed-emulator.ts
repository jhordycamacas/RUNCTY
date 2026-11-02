/**
 * Seeds the local Firebase emulators with the minimum data for development:
 * the pilot city (Loja), the system roles, an admin account and sample
 * routes in Loja (with segments, time slots, risk factors and safety index).
 *
 * Usage: start the emulators (`npm run emulators`), then `npm run seed`.
 * It refuses to run against anything that is not the emulator.
 */
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

// Pure module (no Firebase imports): single source of truth for permissions.
import { ALL_PERMISSIONS, SYSTEM_ROLES } from '../functions/src/roles/permissions';
// Pure route domain: the seed computes lengths and the safety index exactly like the callables.
import { pathLengthM } from '../functions/src/routes/domain/geo';
import type { LatLng, RiskFactorInput, RoutePoint, TimeSlotInput } from '../functions/src/routes/domain/inputs';
import { computeRouteSafety, computeSegmentSafety, type RouteSafety } from '../functions/src/routes/domain/safety';

const PROJECT_ID = 'demo-runcty';
const ADMIN_EMAIL = 'admin@runcty.dev';
const ADMIN_PASSWORD = 'Admin123!';

function assertEmulator(): void {
  if (!process.env.FIRESTORE_EMULATOR_HOST || !process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    console.error(
      'Refusing to seed: FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST must point to the emulators.',
    );
    process.exit(1);
  }
}

async function seedCity(): Promise<void> {
  const db = getFirestore();
  await db.collection('cities').doc('loja').set(
    {
      name: 'Loja',
      province: 'Loja',
      country: 'EC',
      type: 'city',
      location: { lat: -3.99313, lng: -79.20422 },
      coverage: 'active',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log('City seeded: cities/loja');
}

/** System roles (RF-02). merge keeps createdAt stable across re-runs. */
async function seedRoles(): Promise<void> {
  const db = getFirestore();
  for (const [id, role] of Object.entries(SYSTEM_ROLES)) {
    const ref = db.collection('roles').doc(id);
    const exists = (await ref.get()).exists;
    await ref.set(
      {
        name: role.name,
        description: role.description,
        permissions: [...role.permissions].sort(),
        system: true,
        ...(exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  console.log(`Roles seeded: ${Object.keys(SYSTEM_ROLES).join(', ')}`);
}

async function seedAdmin(): Promise<void> {
  const auth = getAuth();
  const user = await auth.getUserByEmail(ADMIN_EMAIL).catch(() =>
    auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: 'Administrador RUNCTY',
      emailVerified: true,
    }),
  );
  await auth.setCustomUserClaims(user.uid, { role: 'admin', perms: [...ALL_PERMISSIONS] });

  await getFirestore().collection('users').doc(user.uid).set(
    {
      uid: user.uid,
      email: ADMIN_EMAIL,
      firstName: 'Administrador',
      lastName: 'RUNCTY',
      cityId: 'loja',
      role: 'admin',
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );
  console.log(`Admin seeded: ${ADMIN_EMAIL} (uid ${user.uid})`);
}

// ---------- Sample routes in Loja (demo data, fictitious risk factors) ----------

interface SeedSegment {
  name: string;
  coordinates: LatLng[];
  factors: RiskFactorInput[];
}

interface SeedRoute {
  id: string;
  name: string;
  description: string;
  start: RoutePoint;
  end: RoutePoint;
  elevationGainM: number;
  surface: 'asphalt' | 'trail' | 'mixed' | 'track';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Times the path is run: 2 = out and back, 3 = three laps. */
  repeats: number;
  segments: SeedSegment[];
}

/** Every route gets the two recommended training slots. */
const SEED_SLOTS: (TimeSlotInput & { id: string })[] = [
  { id: 'morning', label: 'Mañana', startTime: '05:00', endTime: '07:00' },
  { id: 'evening', label: 'Tarde', startTime: '18:00', endTime: '20:00' },
];

const pt = (lat: number, lng: number): LatLng => ({ lat, lng });

const SEED_ROUTES: SeedRoute[] = [
  {
    id: 'loja-jipiro',
    name: 'Parque Recreacional Jipiro',
    description: 'Circuito plano y concurrido alrededor del lago, ideal para empezar. Distancia de tres vueltas.',
    start: { lat: -3.9668, lng: -79.2047, label: 'Entrada principal (Av. Salvador Bustamante Celi)' },
    end: { lat: -3.9712, lng: -79.2032, label: 'Puerta sur del parque' },
    elevationGainM: 18,
    surface: 'asphalt',
    difficulty: 'beginner',
    repeats: 3,
    segments: [
      {
        name: 'Entrada principal al lago',
        coordinates: [pt(-3.9668, -79.2047), pt(-3.9676, -79.2041), pt(-3.9685, -79.2036)],
        factors: [],
      },
      {
        name: 'Vuelta al lago',
        coordinates: [
          pt(-3.9685, -79.2036),
          pt(-3.9693, -79.2022),
          pt(-3.9704, -79.2027),
          pt(-3.9699, -79.2043),
          pt(-3.9685, -79.2036),
        ],
        factors: [],
      },
      {
        name: 'Juegos infantiles a la puerta sur',
        coordinates: [pt(-3.9685, -79.2036), pt(-3.9698, -79.203), pt(-3.9712, -79.2032)],
        factors: [
          {
            type: 'poor_lighting',
            severity: 'low',
            description: 'Algunas luminarias apagadas junto a los juegos.',
            startTime: '18:00',
            endTime: '24:00',
          },
        ],
      },
    ],
  },
  {
    id: 'loja-tebaida',
    name: 'Parque Lineal La Tebaida',
    description: 'Sendero junto al río Malacatos con tramos de tierra y adoquín. Distancia de ida y vuelta.',
    start: { lat: -4.0102, lng: -79.2085, label: 'Ingreso por la Av. Pío Jaramillo' },
    end: { lat: -4.0225, lng: -79.2068, label: 'Puente de La Tebaida' },
    elevationGainM: 32,
    surface: 'mixed',
    difficulty: 'beginner',
    repeats: 2,
    segments: [
      {
        name: 'Ingreso y canchas',
        coordinates: [pt(-4.0102, -79.2085), pt(-4.0128, -79.2081), pt(-4.0151, -79.2077)],
        factors: [],
      },
      {
        name: 'Orilla del río Malacatos',
        coordinates: [pt(-4.0151, -79.2077), pt(-4.0176, -79.2074), pt(-4.0199, -79.2071)],
        factors: [
          {
            type: 'isolated_area',
            severity: 'medium',
            description: 'Poco tránsito de personas al amanecer.',
            startTime: '04:30',
            endTime: '06:30',
          },
          {
            type: 'poor_lighting',
            severity: 'high',
            description: 'Tramo sin alumbrado público.',
            startTime: '18:00',
            endTime: '24:00',
          },
          {
            type: 'harassment',
            severity: 'low',
            description: 'Reportes ocasionales de acoso verbal.',
            startTime: '19:00',
            endTime: '22:00',
          },
        ],
      },
      {
        name: 'Llegada al puente',
        coordinates: [pt(-4.0199, -79.2071), pt(-4.0213, -79.2069), pt(-4.0225, -79.2068)],
        factors: [],
      },
    ],
  },
  {
    id: 'loja-malecon-zamora',
    name: 'Malecón del Río Zamora',
    description: 'Recorrido urbano por el malecón, con cruces de avenidas en horas pico. Distancia de ida y vuelta.',
    start: { lat: -3.9845, lng: -79.1985, label: 'Puente Bolívar' },
    end: { lat: -4.0105, lng: -79.2006, label: 'Redondel de la Av. Emiliano Ortega' },
    elevationGainM: 25,
    surface: 'asphalt',
    difficulty: 'intermediate',
    repeats: 2,
    segments: [
      {
        name: 'Puente Bolívar a la Av. Universitaria',
        coordinates: [pt(-3.9845, -79.1985), pt(-3.989, -79.199), pt(-3.9935, -79.1994)],
        factors: [
          {
            type: 'traffic',
            severity: 'high',
            description: 'Cruces sin semáforo con mucho tráfico de entrada a la ciudad.',
            startTime: '06:00',
            endTime: '08:30',
          },
          {
            type: 'traffic',
            severity: 'medium',
            description: 'Tráfico de salida en hora pico.',
            startTime: '17:00',
            endTime: '20:00',
          },
        ],
      },
      {
        name: 'Malecón central',
        coordinates: [pt(-3.9935, -79.1994), pt(-3.9985, -79.1998), pt(-4.003, -79.2001)],
        factors: [
          { type: 'flood_risk', severity: 'low', description: 'Se encharca cuando llueve fuerte.' },
          {
            type: 'poor_lighting',
            severity: 'high',
            description: 'Luminarias dañadas en varios postes.',
            startTime: '18:00',
            endTime: '24:00',
          },
        ],
      },
      {
        name: 'Llegada a la Av. Emiliano Ortega',
        coordinates: [pt(-4.003, -79.2001), pt(-4.0065, -79.2003), pt(-4.0105, -79.2006)],
        factors: [],
      },
    ],
  },
  {
    id: 'loja-puear',
    name: 'Parque Universitario (PUEAR)',
    description: 'Senderos de montaña en el bosque de la Universidad Nacional de Loja, con subidas exigentes. Distancia de ida y vuelta.',
    start: { lat: -4.0325, lng: -79.2002, label: 'Ingreso por la UNL' },
    end: { lat: -4.0418, lng: -79.1935, label: 'Mirador del PUEAR' },
    elevationGainM: 180,
    surface: 'trail',
    difficulty: 'advanced',
    repeats: 2,
    segments: [
      {
        name: 'Ingreso UNL al sendero bajo',
        coordinates: [pt(-4.0325, -79.2002), pt(-4.0345, -79.199), pt(-4.0362, -79.1978)],
        factors: [],
      },
      {
        name: 'Sendero del bosque',
        coordinates: [pt(-4.0362, -79.1978), pt(-4.0378, -79.1962), pt(-4.0395, -79.1951), pt(-4.0404, -79.1944)],
        factors: [
          {
            type: 'isolated_area',
            severity: 'high',
            description: 'Bosque sin personas cerca a primera hora.',
            startTime: '05:00',
            endTime: '07:30',
          },
          { type: 'uneven_terrain', severity: 'medium', description: 'Raíces y piedras sueltas.' },
          {
            type: 'poor_lighting',
            severity: 'high',
            description: 'Sendero sin iluminación.',
            startTime: '18:00',
            endTime: '24:00',
          },
          {
            type: 'isolated_area',
            severity: 'high',
            description: 'Zona aislada al anochecer.',
            startTime: '18:30',
            endTime: '24:00',
          },
        ],
      },
      {
        name: 'Subida al mirador',
        coordinates: [pt(-4.0404, -79.1944), pt(-4.0411, -79.194), pt(-4.0418, -79.1935)],
        factors: [{ type: 'uneven_terrain', severity: 'low', description: 'Escalones de tierra irregulares.' }],
      },
    ],
  },
  {
    id: 'loja-pucara-orillas',
    name: 'Parque Pucará y Av. Orillas del Zamora',
    description: 'Ruta larga hacia el norte por la Av. Orillas del Zamora hasta el Parque Pucará. Distancia de ida y vuelta.',
    start: { lat: -3.9985, lng: -79.1998, label: 'Av. Orillas del Zamora y Av. Universitaria' },
    end: { lat: -3.952, lng: -79.209, label: 'Parque Pucará' },
    elevationGainM: 140,
    surface: 'asphalt',
    difficulty: 'intermediate',
    repeats: 2,
    segments: [
      {
        name: 'Av. Orillas del Zamora (centro)',
        coordinates: [pt(-3.9985, -79.1998), pt(-3.9935, -79.1994), pt(-3.985, -79.199), pt(-3.976, -79.1995), pt(-3.97, -79.2005)],
        factors: [
          {
            type: 'traffic',
            severity: 'medium',
            description: 'Tráfico intenso al salir del trabajo.',
            startTime: '17:30',
            endTime: '19:30',
          },
        ],
      },
      {
        name: 'Orillas del Zamora (norte)',
        coordinates: [pt(-3.97, -79.2005), pt(-3.964, -79.203), pt(-3.958, -79.2055)],
        factors: [
          {
            type: 'isolated_area',
            severity: 'high',
            description: 'Tramo solitario antes del amanecer.',
            startTime: '04:30',
            endTime: '06:00',
          },
          {
            type: 'poor_lighting',
            severity: 'high',
            description: 'Alumbrado escaso hasta que amanece.',
            startTime: '00:00',
            endTime: '06:15',
          },
          {
            type: 'harassment',
            severity: 'medium',
            description: 'Reportes de acoso al anochecer cerca de la parada de buses.',
            startTime: '18:00',
            endTime: '21:00',
          },
        ],
      },
      {
        name: 'Subida al Parque Pucará',
        coordinates: [pt(-3.958, -79.2055), pt(-3.955, -79.2072), pt(-3.952, -79.209)],
        factors: [],
      },
    ],
  },
];

const LEVEL_LABELS = { high: 'Alto', medium: 'Medio', low: 'Bajo' } as const;

/**
 * Rewrites each sample route from scratch (fixed ids, so re-running is
 * idempotent): route, segments, time slots and risk factors, with lengths
 * and the safety index computed by the same pure functions as the backend.
 */
async function seedRoutes(): Promise<void> {
  const db = getFirestore();
  const slots = SEED_SLOTS.map(({ id, startTime, endTime }) => ({ id, startTime, endTime }));

  for (const route of SEED_ROUTES) {
    const routeRef = db.collection('routes').doc(route.id);
    // Drops segments or factors left by an older version of the seed.
    await db.recursiveDelete(routeRef);

    const segments = route.segments.map((segment, order) => ({
      id: `seg-${order + 1}`,
      name: segment.name,
      order,
      coordinates: segment.coordinates,
      lengthM: pathLengthM(segment.coordinates),
      factors: segment.factors,
      safety: computeSegmentSafety(slots, segment.factors),
    }));
    const safety: RouteSafety = computeRouteSafety(slots, segments);
    const pathKm = segments.reduce((sum, s) => sum + s.lengthM, 0) / 1000;
    const distanceKm = Math.round(pathKm * (route.repeats) * 10) / 10;

    const batch = db.batch();
    const ts = FieldValue.serverTimestamp();
    batch.set(routeRef, {
      name: route.name,
      cityId: 'loja',
      description: route.description,
      start: route.start,
      end: route.end,
      distanceKm,
      elevationGainM: route.elevationGainM,
      surface: route.surface,
      difficulty: route.difficulty,
      active: true,
      segmentCount: segments.length,
      safety,
      safetyUpdatedAt: ts,
      createdAt: ts,
      updatedAt: ts,
    });
    for (const { id, ...slot } of SEED_SLOTS) {
      batch.set(routeRef.collection('timeSlots').doc(id), { ...slot, createdAt: ts, updatedAt: ts });
    }
    for (const segment of segments) {
      const segmentRef = routeRef.collection('segments').doc(segment.id);
      batch.set(segmentRef, {
        name: segment.name,
        order: segment.order,
        coordinates: segment.coordinates,
        lengthM: segment.lengthM,
        safety: segment.safety,
        createdAt: ts,
        updatedAt: ts,
      });
      segment.factors.forEach((factor, i) => {
        batch.set(segmentRef.collection('riskFactors').doc(`factor-${i + 1}`), {
          ...factor,
          createdAt: ts,
          updatedAt: ts,
        });
      });
    }
    await batch.commit();

    const summary = slots
      .map(({ id, startTime, endTime }) => `${startTime}–${endTime} ${LEVEL_LABELS[safety[id].level]} (${safety[id].score})`)
      .join(', ');
    console.log(`Route seeded: routes/${route.id} — ${route.name}, ${distanceKm} km — ${summary}`);
  }
}

async function main(): Promise<void> {
  assertEmulator();
  initializeApp({ projectId: PROJECT_ID });
  await seedCity();
  await seedRoles();
  await seedAdmin();
  await seedRoutes();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
