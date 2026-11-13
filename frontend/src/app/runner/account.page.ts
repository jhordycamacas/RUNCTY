import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonButton, IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular';
import { AuthService } from '../core/auth/auth.service';

/** Placeholder of the account tab: sign-out for now; profile and preferences arrive later. */
@Component({
  selector: 'app-runner-account-page',
  imports: [IonButton, IonContent, IonHeader, IonTitle, IonToolbar],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Cuenta</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>{{ session()?.email }}</p>
      <ion-button fill="outline" (click)="signOut()">Cerrar sesión</ion-button>
    </ion-content>
  `,
})
export class RunnerAccountPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly session = this.auth.session;

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
