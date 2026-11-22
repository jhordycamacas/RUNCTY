import {
  Component,
  DestroyRef,
  TemplateRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
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
import { BrandLogo } from '../shared/ui/brand-logo';
import { AdminTopbar } from './admin-header';
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
 * Admin area layout, as in the reference: a warm gray frame with one gutter everywhere, a white
 * rounded sidebar (brand on top, the sections with the active one as a dark pill, the account
 * card at the bottom) and the pages beside it. Each page's header (`app-admin-header`) draws the
 * theme and account actions this shell hands it. On narrow screens the sidebar collapses into
 * the Ionic menu and those actions move into it.
 */
@Component({
  selector: 'app-admin-shell',
  imports: [
    BrandLogo,
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
                <app-brand-logo size="2.75rem" />
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
      </div>
    </ion-split-pane>

    <ng-template #topbarActions>
      <app-theme-selector [compact]="true" />
      <span class="user"
        ><span class="avatar" aria-hidden="true">{{ initial() }}</span
        ><span class="user-email">{{ email() }}</span></span
      >
      <ion-button fill="outline" size="small" (click)="signOut()">
        <ion-icon slot="start" name="log-out-outline" aria-hidden="true" />
        Cerrar sesión
      </ion-button>
    </ng-template>
  `,
  styles: `
    :host {
      display: contents;
    }

    // The sidebar is a white rounded panel floating on the warm gray frame, one gutter from the
    // top, the bottom and the left edge; the page beside it starts one gutter further right.
    ion-menu {
      --background: var(--rc-backdrop);
      --width: calc(16rem + var(--rc-admin-gutter));
      --border: 0;
    }

    ion-menu ion-content {
      --background: var(--rc-backdrop);
      color: var(--rc-text);
    }

    .panel {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: var(--rc-space-lg);
      // On the phone the menu also clears the status bar and the gesture bar.
      min-height: calc(
        100% - 2 * var(--rc-admin-gutter) - var(--ion-safe-area-top, 0px) -
          var(--ion-safe-area-bottom, 0px)
      );
      margin: calc(var(--rc-admin-gutter) + var(--ion-safe-area-top, 0px)) 0
        calc(var(--rc-admin-gutter) + var(--ion-safe-area-bottom, 0px)) var(--rc-admin-gutter);
      padding: var(--rc-space-md);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-sidebar);
    }

    .brand {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
      padding: var(--rc-space-xs) var(--rc-space-xs) var(--rc-space-md);
    }

    .brand p {
      display: grid;
      margin: 0;
      line-height: 1.25;
    }

    .brand p strong {
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    .brand p span {
      font-size: var(--rc-font-size-caption);
      color: var(--rc-text-muted);
    }

    .group {
      margin: var(--rc-space-sm) var(--rc-space-sm) var(--rc-space-xs);
      font-size: var(--rc-font-size-caption);
      font-weight: 500;
      color: var(--rc-text-muted);
    }

    ion-list {
      padding: 0;
      background: transparent;
    }

    ion-item {
      --background: transparent;
      --background-hover: var(--rc-text);
      --background-hover-opacity: 0.06;
      --color: var(--rc-text);
      --border-radius: var(--rc-radius-pill);
      --min-height: var(--rc-min-touch-target);
      margin-bottom: 2px;
      font-weight: 500;
    }

    ion-item ion-icon {
      color: var(--rc-text-muted);
    }

    // The active section is a dark pill (a light one in the dark theme).
    ion-item.active {
      --background: var(--rc-text);
      --color: var(--rc-surface-elevated);
      border-radius: var(--rc-radius-pill);
    }

    ion-item.active ion-icon {
      color: var(--rc-surface-elevated);
    }

    // The signed-in user, as a soft card at the bottom of the sidebar.
    .account {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      gap: var(--rc-space-md);
      padding: var(--rc-space-md);
      border-radius: var(--rc-radius-md);
      background: var(--rc-surface);
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
      font-weight: 600;
    }

    .who p span {
      font-size: var(--rc-font-size-caption);
      color: var(--rc-text-muted);
    }

    .avatar {
      display: grid;
      flex: none;
      place-items: center;
      width: 2.25rem;
      height: 2.25rem;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font-size: var(--rc-font-size-label);
      font-weight: 600;
      text-transform: uppercase;
    }

    .main {
      position: relative;
      flex: 1 1 auto;
      width: 100%;
      min-width: 0;
      height: 100%;
    }

    .user {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      min-height: var(--rc-min-touch-target);
      padding: 0 var(--rc-space-lg) 0 var(--rc-space-xs);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface-elevated);
      font-size: var(--rc-font-size-label);
      font-weight: 500;
    }

    @media (max-width: 70rem) {
      .user-email {
        display: none;
      }

      .user {
        padding-right: var(--rc-space-xs);
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

  private readonly topbarActions = viewChild.required<TemplateRef<unknown>>('topbarActions');

  constructor() {
    const topbar = inject(AdminTopbar);
    // On wide screens the page headers carry the account actions; on narrow ones the menu does.
    effect(() => topbar.actions.set(this.desktop() ? this.topbarActions() : null));
    inject(DestroyRef).onDestroy(() => topbar.actions.set(null));

    const listener = (event: MediaQueryListEvent) => this.desktop.set(event.matches);
    this.media.addEventListener('change', listener);
    inject(DestroyRef).onDestroy(() => this.media.removeEventListener('change', listener));
  }

  protected async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
