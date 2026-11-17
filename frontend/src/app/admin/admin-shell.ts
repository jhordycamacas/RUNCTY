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
          <div class="panel">
            <nav aria-label="Administración">
              <div class="brand">
                <img class="logo" src="brand/logo.png" alt="" width="40" height="40" />
                <p>
                  <strong>RUNCTY</strong>
                  <span>Administración</span>
                </p>
              </div>
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
              <div class="account">
                <span class="avatar" aria-hidden="true">{{ initial() }}</span>
                <p>{{ email() }}</p>
              </div>
              <app-theme-selector />
              <ion-button fill="outline" size="small" (click)="signOut()">Cerrar sesión</ion-button>
            </div>
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
      --background: var(--rc-sidebar);
      color: var(--rc-on-sidebar);
      position: absolute;
      inset: var(--rc-space-lg);
      width: auto;
      height: auto;
      border-radius: var(--rc-radius-lg);
      box-shadow: var(--rc-shadow-md);
      overflow: hidden;
    }

    .panel {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100%;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
      padding: var(--rc-space-xl) var(--rc-space-xl) var(--rc-space-md);
    }

    .brand p {
      display: grid;
      margin: 0;
      line-height: 1.2;
    }

    .brand p strong {
      color: var(--rc-on-sidebar);
      font-size: var(--rc-font-size-subtitle);
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .brand p span {
      font-size: var(--rc-font-size-caption);
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--rc-on-sidebar-muted);
    }

    .logo {
      flex: none;
      width: 2.5rem;
      height: 2.5rem;
      object-fit: contain;
    }

    .avatar {
      display: grid;
      flex: none;
      place-items: center;
      border-radius: var(--rc-radius-sm);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font-weight: 800;
    }

    ion-list {
      padding: var(--rc-space-sm) var(--rc-space-md);
      background: transparent;
    }

    ion-item {
      --background: transparent;
      --color: var(--rc-on-sidebar-muted);
      --border-radius: var(--rc-radius-md);
      --min-height: var(--rc-min-touch-target);
      margin-bottom: var(--rc-space-xs);
      font-weight: 700;
    }

    ion-item ion-icon {
      color: var(--rc-on-sidebar-muted);
    }

    ion-item.active {
      --background: var(--rc-primary);
      --color: var(--rc-on-primary);
      border-radius: var(--rc-radius-md);
    }

    ion-item.active ion-icon {
      color: var(--rc-on-primary);
    }

    .footer {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: var(--rc-space-md);
      margin: var(--rc-space-md);
      padding: var(--rc-space-lg);
      border-radius: var(--rc-radius-md);
      background: rgb(255 255 255 / 8%);
      color: var(--rc-on-sidebar);
      font-size: var(--rc-font-size-label);
      overflow-wrap: anywhere;
    }

    .account {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
      min-width: 0;
    }

    .avatar {
      width: 2.25rem;
      height: 2.25rem;
      text-transform: uppercase;
    }

    .account p {
      margin: 0;
      min-width: 0;
      font-weight: 600;
    }

    .footer ion-button.button-outline:not(.ion-color) {
      --color: var(--rc-on-sidebar);
      --border-color: var(--rc-on-sidebar-muted);
    }

    app-theme-selector {
      align-self: stretch;
      --label-color: var(--rc-on-sidebar-muted);
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
  protected readonly initial = computed(() => this.email().charAt(0) || 'A');

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
