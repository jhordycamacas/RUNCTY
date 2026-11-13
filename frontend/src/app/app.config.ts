import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular';
import { apiErrorInterceptor } from './core/api/api-error.interceptor';
import { bearerTokenInterceptor } from './core/api/bearer-token.interceptor';
import { FirebaseAuthGateway } from './core/auth/firebase-auth.gateway';
import { SdkFirebaseAuthGateway } from './core/auth/sdk-firebase-auth.gateway';
import { routes } from './app.routes';
import { UsersRepository } from './auth/domain/ports';
import { HttpUsersRepository } from './auth/infrastructure/http-users.repository';
import { CityRepository } from './cities/domain/city';
import { HttpCityRepository } from './cities/infrastructure/http-city.repository';

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
  ],
};
