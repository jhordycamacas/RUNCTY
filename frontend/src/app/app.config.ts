import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { apiErrorInterceptor } from './core/api/api-error.interceptor';
import { bearerTokenInterceptor } from './core/api/bearer-token.interceptor';
import { CatalogRepository } from './core/catalogs/catalog';
import { HttpCatalogRepository } from './core/catalogs/http-catalog.repository';
import { FirebaseAuthGateway } from './core/auth/firebase-auth.gateway';
import { SdkFirebaseAuthGateway } from './core/auth/sdk-firebase-auth.gateway';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { AccountRepository, ProfileRepository } from './account/domain/profile';
import { HttpAccountRepository } from './account/infrastructure/http-account.repository';
import { HttpProfileRepository } from './account/infrastructure/http-profile.repository';
import { UsersRepository } from './auth/domain/ports';
import { HttpUsersRepository } from './auth/infrastructure/http-users.repository';
import { CityRepository } from './cities/domain/city';
import { HttpCityRepository } from './cities/infrastructure/http-city.repository';
import { PreferencesStore } from './preferences/application/preferences.store';
import {
  PreferencesCache,
  PreferencesDisplay,
  PreferencesRepository,
} from './preferences/domain/preferences';
import { DocumentPreferencesDisplay } from './preferences/infrastructure/document-preferences-display';
import { HttpPreferencesRepository } from './preferences/infrastructure/http-preferences.repository';
import { LocalStoragePreferencesCache } from './preferences/infrastructure/local-storage-preferences.cache';
import { ProfilePhotoRepository } from './account/domain/profile-photo';
import { HttpProfilePhotoRepository } from './account/infrastructure/http-profile-photo.repository';
import { RiskZoneAlertRepository } from './alerts/domain/risk-zone-alert';
import { HttpRiskZoneAlertRepository } from './alerts/infrastructure/http-risk-zone-alert.repository';
import { RouteRepository } from './routes/domain/route';
import { HttpRouteRepository } from './routes/infrastructure/http-route.repository';
import { PositionSource } from './run/domain/position-source';
import { CapacitorPositionSource } from './run/infrastructure/capacitor-position-source';
import { provideMapRenderer } from './shared/map/map-renderer-provider';
import { SportProfileRepository } from './sport-profile/domain/sport-profile';
import { HttpSportProfileRepository } from './sport-profile/infrastructure/http-sport-profile.repository';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideIonicAngular(),
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideRouter(routes),
    provideHttpClient(withInterceptors([bearerTokenInterceptor, apiErrorInterceptor])),
    { provide: FirebaseAuthGateway, useClass: SdkFirebaseAuthGateway },
    { provide: UsersRepository, useClass: HttpUsersRepository },
    { provide: CityRepository, useClass: HttpCityRepository },
    { provide: ProfileRepository, useClass: HttpProfileRepository },
    { provide: ProfilePhotoRepository, useClass: HttpProfilePhotoRepository },
    { provide: AccountRepository, useClass: HttpAccountRepository },
    { provide: SportProfileRepository, useClass: HttpSportProfileRepository },
    { provide: CatalogRepository, useClass: HttpCatalogRepository },
    { provide: RouteRepository, useClass: HttpRouteRepository },
    { provide: RiskZoneAlertRepository, useClass: HttpRiskZoneAlertRepository },
    { provide: PositionSource, useClass: CapacitorPositionSource },
    { provide: PreferencesRepository, useClass: HttpPreferencesRepository },
    { provide: PreferencesCache, useClass: LocalStoragePreferencesCache },
    { provide: PreferencesDisplay, useClass: DocumentPreferencesDisplay },
    provideMapRenderer(environment.googleMapsApiKey),
    // Applies the appearance and font size as soon as the user is known, on any screen.
    provideAppInitializer(() => {
      inject(PreferencesStore);
    }),
  ],
};
