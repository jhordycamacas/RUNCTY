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
import { businessOutline, gridOutline, peopleOutline, shieldCheckmarkOutline, trailSignOutline } from 'ionicons/icons';
import { AuthService } from '../core/auth/auth.service';
import { ADMIN_SECTIONS } from './admin-sections';
import { ThemeSelector } from './theme-selector';

addIcons({ businessOutline, gridOutline, peopleOutline, shieldCheckmarkOutline, trailSignOutline });

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
    ThemeSelector,
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
            <app-theme-selector />
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
      --width: 17rem;
      --border: 0;
    }

    // A floating white panel on the tinted page, like a rounded card.
    ion-menu ion-content {
      --background: var(--rc-surface-elevated);
      position: absolute;
      inset: var(--rc-space-lg);
      width: auto;
      height: auto;
      border-radius: var(--rc-radius-lg);
      box-shadow: var(--rc-shadow-md);
      overflow: hidden;
    }

    .brand {
      margin: 0;
      padding: var(--rc-space-xl) var(--rc-space-xl) var(--rc-space-md);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 700;
      color: var(--rc-primary-text);
    }

    ion-list {
      padding: var(--rc-space-sm) var(--rc-space-md);
      background: transparent;
    }

    ion-item {
      --background: transparent;
      --border-radius: var(--rc-radius-pill);
      --min-height: var(--rc-min-touch-target);
      margin-bottom: var(--rc-space-xs);
      font-weight: 600;
    }

    ion-item.active {
      --background: var(--rc-primary);
      --color: var(--rc-on-primary);
    }

    ion-item.active ion-icon {
      color: var(--rc-on-primary);
    }

    .footer {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--rc-space-md);
      padding: var(--rc-space-lg);
      border-top: 1px solid var(--rc-border);
      margin-top: var(--rc-space-md);
      font-size: var(--rc-font-size-label);
      color: var(--rc-text-muted);
      overflow-wrap: anywhere;
    }

    .footer p {
      margin: 0;
    }

    app-theme-selector {
      align-self: stretch;
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
