import { Component, inject } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { AuthService } from '../core/auth/auth.service';

/** Placeholder of the runner home; the cities and routes screens arrive with the runner area. */
@Component({
  selector: 'app-runner-home-page',
  imports: [IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <h1>Hola{{ session()?.email ? ', ' + session()?.email : '' }}</h1>
      <p>Pronto verás aquí las rutas seguras de tu ciudad.</p>
    </ion-content>
  `,
})
export class RunnerHomePage {
  protected readonly session = inject(AuthService).session;
}
