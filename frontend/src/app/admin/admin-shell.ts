import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonMenu,
  IonRouterOutlet,
  IonSplitPane,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { businessOutline, peopleOutline, shieldCheckmarkOutline, trailSignOutline } from 'ionicons/icons';
import { AuthService } from '../core/auth/auth.service';
import { ADMIN_SECTIONS } from './admin-sections';

addIcons({ businessOutline, peopleOutline, shieldCheckmarkOutline, trailSignOutline });

/** Admin area layout: desktop-first, a permanent side menu that collapses on narrow screens. */
@Component({
  selector: 'app-admin-shell',
  imports: [
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonMenu,
    IonRouterOutlet,
    IonSplitPane,
    RouterLink,
    RouterLinkActive,
  ],
  host: { class: 'area-admin' },
  template: `
    <ion-split-pane contentId="admin-content" when="md">
      <ion-menu contentId="admin-content">
        <ion-content>
          <nav aria-label="Administración">
            <p class="brand">RUNCTY · Administración</p>
            <ion-list lines="none">
              @for (section of sections(); track section.path) {
                <ion-item
                  button
                  detail="false"
                  [routerLink]="['/admin', section.path]"
                  routerLinkActive="active"
                >
                  <ion-icon slot="start" [name]="section.icon" aria-hidden="true" />
                  <ion-label>{{ section.label }}</ion-label>
                </ion-item>
              }
            </ion-list>
          </nav>
          <div class="footer">
            <p>{{ email() }}</p>
            <ion-button fill="outline" size="small" (click)="signOut()">Cerrar sesión</ion-button>
          </div>
        </ion-content>
      </ion-menu>
      <ion-router-outlet id="admin-content" />
    </ion-split-pane>
  `,
  styles: `
    :host {
      display: contents;
    }

    ion-menu {
      --background: var(--rc-sidebar-background);
      --width: 16rem;
    }

    .brand {
      margin: 0;
      padding: var(--rc-space-lg);
      font-weight: 700;
      color: var(--rc-primary-text);
    }

    ion-item {
      --background: transparent;
      --min-height: var(--rc-min-touch-target);
    }

    ion-item.active {
      --background: var(--rc-primary-tint);
      --color: var(--rc-primary-text);
      font-weight: 600;
    }

    .footer {
      padding: var(--rc-space-lg);
      border-top: 1px solid var(--rc-border);
      font-size: var(--rc-font-size-label);
      color: var(--rc-text-muted);
      overflow-wrap: anywhere;
    }
  `,
})
export class AdminShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  // `can()` reads the session signal, so the menu follows sign-in and sign-out.
  protected readonly sections = computed(() =>
    ADMIN_SECTIONS.filter((section) => this.auth.can(section.permission)),
  );
  protected readonly email = computed(() => this.auth.session()?.email ?? '');

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
