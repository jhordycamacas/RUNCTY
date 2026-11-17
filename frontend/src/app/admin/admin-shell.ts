import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
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
import {
  businessOutline,
  gridOutline,
  logOutOutline,
  peopleOutline,
  shieldCheckmarkOutline,
  trailSignOutline,
} from 'ionicons/icons';
import { AuthService } from '../core/auth/auth.service';
import { ADMIN_SECTIONS } from './admin-sections';
import { ThemeSelector } from './theme-selector';

addIcons({
  businessOutline,
  gridOutline,
  logOutOutline,
  peopleOutline,
  shieldCheckmarkOutline,
  trailSignOutline,
});

/** Width from which the side menu stays open (Ionic's `md` split pane). */
const DESKTOP_QUERY = '(min-width: 768px)';

/**
 * Admin area layout, like a conventional admin web: a gray sidebar flush to the left edge with the
 * brand on top and the account pinned at the bottom, and a top bar whose right side holds the
 * theme and the account actions. On narrow screens the sidebar collapses into the Ionic menu and
 * those actions move into it.
 */
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
                <img class="logo" src="brand/logo.png" alt="" width="36" height="36" />
                <p>
                  <strong>RUNCTY</strong>
                  <span>Gacelas Running Team</span>
                </p>
              </div>
              <p class="group">Administración</p>
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
            <div class="account">
              <div class="who">
                <span class="avatar" aria-hidden="true">{{ initial() }}</span>
                <p>
                  <strong>{{ email() }}</strong>
                  <span>{{ role() }}</span>
                </p>
              </div>
              @if (!desktop()) {
                <app-theme-selector />
                <ion-button fill="outline" size="small" (click)="signOut()"
                  >Cerrar sesión</ion-button
                >
              }
            </div>
          </div>
        </ion-content>
      </ion-menu>

      <div id="admin-content" class="main">
        <ion-router-outlet />
        @if (desktop()) {
          <div class="topbar-actions">
            <app-theme-selector [compact]="true" />
            <span class="user"
              ><span class="avatar" aria-hidden="true">{{ initial() }}</span
              ><span class="user-email">{{ email() }}</span></span
            >
            <ion-button fill="outline" size="small" (click)="signOut()">
              <ion-icon slot="start" name="log-out-outline" aria-hidden="true" />
              Cerrar sesión
            </ion-button>
          </div>
        }
      </div>
    </ion-split-pane>
  `,
  styles: `
    :host {
      display: contents;
    }

    ion-menu {
      --background: var(--rc-sidebar);
      --width: 15rem;
      --border: 0;
    }

    ion-menu ion-content {
      --background: var(--rc-sidebar);
      color: var(--rc-text);
    }

    // Full height, flush to the edges, with a hairline on its right side.
    .panel {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 100%;
      border-right: 1px solid color-mix(in srgb, var(--rc-text) 14%, transparent);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
      padding: var(--rc-space-lg) var(--rc-space-lg) var(--rc-space-md);
      border-bottom: 1px solid color-mix(in srgb, var(--rc-text) 14%, transparent);
    }

    .brand p {
      display: grid;
      margin: 0;
      line-height: 1.25;
    }

    .brand p strong {
      font-size: var(--rc-font-size-subtitle);
      font-weight: 800;
      letter-spacing: 0.04em;
    }

    .brand p span {
      font-size: var(--rc-font-size-caption);
      color: var(--rc-text-muted);
    }

    .logo {
      flex: none;
      width: 2.25rem;
      height: 2.25rem;
      object-fit: contain;
    }

    .group {
      margin: var(--rc-space-lg) var(--rc-space-lg) var(--rc-space-xs);
      font-size: var(--rc-font-size-caption);
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--rc-text-muted);
    }

    ion-list {
      padding: 0 var(--rc-space-sm);
      background: transparent;
    }

    ion-item {
      --background: transparent;
      --background-hover: var(--rc-text);
      --background-hover-opacity: 0.06;
      --color: var(--rc-text);
      --border-radius: var(--rc-radius-md);
      --min-height: 2.5rem;
      margin-bottom: 2px;
      font-weight: 600;
    }

    ion-item ion-icon {
      color: var(--rc-text-muted);
    }

    ion-item.active {
      --background: var(--rc-primary);
      --color: var(--rc-on-primary);
      border-radius: var(--rc-radius-md);
    }

    ion-item.active ion-icon {
      color: var(--rc-on-primary);
    }

    .account {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--rc-space-md);
      padding: var(--rc-space-md) var(--rc-space-lg) var(--rc-space-lg);
      border-top: 1px solid color-mix(in srgb, var(--rc-text) 14%, transparent);
    }

    .who {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
      min-width: 0;
    }

    .who p {
      display: grid;
      min-width: 0;
      margin: 0;
      line-height: 1.25;
      font-size: var(--rc-font-size-label);
    }

    .who strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 700;
    }

    .who p span {
      font-size: var(--rc-font-size-caption);
      color: var(--rc-text-muted);
    }

    .avatar {
      display: grid;
      flex: none;
      place-items: center;
      width: 2rem;
      height: 2rem;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font-size: var(--rc-font-size-label);
      font-weight: 800;
      text-transform: uppercase;
    }

    .main {
      position: relative;
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
      height: 100%;
    }

    // The right side of every page's top bar.
    .topbar-actions {
      position: absolute;
      z-index: 5;
      top: 0;
      right: 0;
      display: flex;
      align-items: center;
      gap: var(--rc-space-lg);
      height: var(--rc-topbar-height);
      padding-inline: var(--rc-space-xl);
    }

    .user {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      font-size: var(--rc-font-size-label);
      font-weight: 600;
    }

    @media (max-width: 70rem) {
      .user-email {
        display: none;
      }
    }

    .user-email {
      max-width: 14rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class AdminShell {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly media = window.matchMedia(DESKTOP_QUERY);
  /** Whether the sidebar is permanent (and the top bar carries the actions). */
  protected readonly desktop = signal(this.media.matches);

  // `can()` reads the session signal, so the menu follows sign-in and sign-out.
  protected readonly sections = computed(() =>
    ADMIN_SECTIONS.filter((section) => this.auth.can(section.permission)),
  );
  protected readonly email = computed(() => this.auth.session()?.email ?? '');
  protected readonly role = computed(() =>
    this.auth.session()?.role === 'admin' ? 'Administrador' : 'Personal del panel',
  );
  protected readonly initial = computed(() => this.email().charAt(0) || 'A');

  constructor() {
    const listener = (event: MediaQueryListEvent) => this.desktop.set(event.matches);
    this.media.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => this.media.removeEventListener('change', listener));
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
