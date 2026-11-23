import { EnvironmentProviders, Provider, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { Profile, ProfileRepository } from '../../../account/domain/profile';
import { CityRecord, CityRepository } from '../../../cities/domain/city';
import { AuthService } from '../../../core/auth/auth.service';
import { FirebaseAuthGateway } from '../../../core/auth/firebase-auth.gateway';
import { FakeFirebaseAuthGateway } from '../../../core/auth/testing/fake-firebase-auth.gateway';
import { PreferencesStore } from '../../../preferences/application/preferences.store';
import { Preferences, defaultPreferences } from '../../../preferences/domain/preferences';
import { Route, RouteDetail, RouteRepository } from '../../domain/route';
import { route, slot } from '../../domain/testing/fixtures';

/** What the fake API answers; a screen test changes it before (or between) renders. */
export interface FakeBackend {
  profile: Profile | Error;
  cities: CityRecord[] | Error;
  /** A never-settled promise keeps the screen loading. */
  routes: Route[] | Error | Promise<Route[]>;
  detail: RouteDetail | Error;
  preferences: ReturnType<typeof signal<Preferences>>;
  /** How many times each list was requested. */
  requests: { routes: number };
}

export const RUNNER: Profile = {
  uid: 'u1',
  email: 'ana@runcty.dev',
  firstName: 'Ana',
  lastName: 'Torres',
  birthDate: '1998-07-14',
  cityId: 'loja',
  idNumber: null,
  role: 'runner',
};

export function fakeBackend(routes: Route[]): FakeBackend {
  return {
    profile: RUNNER,
    cities: [{ id: 'loja', name: 'Loja' }],
    routes,
    detail: { route: routes[0], segments: [] },
    preferences: signal(defaultPreferences()),
    requests: { routes: 0 },
  };
}

const answer = async <T>(value: T | Error | Promise<T>): Promise<T> => {
  if (value instanceof Error) throw value;
  return value;
};

/** Real stores over fake repositories: the screens run their full application layer. */
export function provideFakeBackend(backend: FakeBackend): (Provider | EnvironmentProviders)[] {
  return [
    provideRouter([]),
    {
      provide: AuthService,
      useValue: {
        session: signal({
          uid: 'u1',
          email: RUNNER.email,
          emailVerified: true,
          role: 'runner',
          perms: [],
        }),
      },
    },
    { provide: FirebaseAuthGateway, useValue: new FakeFirebaseAuthGateway() },
    { provide: ProfileRepository, useValue: { get: () => answer(backend.profile) } },
    { provide: CityRepository, useValue: { list: () => answer(backend.cities) } },
    {
      provide: RouteRepository,
      useValue: {
        listByCity: () => {
          backend.requests.routes += 1;
          return answer(backend.routes);
        },
        get: () => answer(backend.detail),
      },
    },
    { provide: PreferencesStore, useValue: { preferences: backend.preferences } },
  ];
}

/** Lets the stores' promises and the effects they trigger settle, then renders. */
export async function settle(fixture: { detectChanges(): void }): Promise<void> {
  for (let i = 0; i < 4; i += 1) {
    await new Promise((resolve) => setTimeout(resolve));
    fixture.detectChanges();
  }
}

/** A catalogue like the demo seed: three routes with different distance, difficulty and safety. */
export function catalogRoutes(): Route[] {
  return [
    route('jipiro', {
      name: 'Parque Jipiro',
      distanceKm: 3.2,
      elevationGainM: 15,
      start: { lat: -3.97, lng: -79.2, label: 'Entrada principal' },
      end: { lat: -3.98, lng: -79.2, label: 'Puente sur' },
      safety: [
        slot('morning', '05:00', '07:00', 90),
        {
          ...slot('evening', '18:00', '20:00', 30),
          factors: [
            {
              type: 'Iluminación deficiente',
              severity: 'high',
              description: 'Postes apagados',
              segmentId: 's2',
              segmentName: 'Orilla del río',
            },
          ],
        },
      ],
    }),
    route('tebaida', {
      name: 'Parque Lineal La Tebaida',
      distanceKm: 7.5,
      difficulty: 'Intermedio',
      surface: 'Mixto',
      safety: [slot('morning', '05:00', '07:00', 55), slot('evening', '18:00', '20:00', 80)],
    }),
    route('nueva', { name: 'Ruta nueva', distanceKm: 12, difficulty: 'Avanzado', safety: [] }),
  ];
}
