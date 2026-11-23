import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  checkmarkCircle,
  chevronForward,
  fitnessOutline,
  lockClosedOutline,
  logOutOutline,
  mailUnreadOutline,
  optionsOutline,
  pencilOutline,
  peopleOutline,
  trashOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/auth/auth.service';
import { Avatar } from '../../shared/ui/avatar';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { Notice } from '../../shared/ui/notice';
import { TabHeader } from '../../shared/ui/tab-header';
import { FriendsStore } from '../../friends/application/friends.store';
import { ProfilePhotoStore } from '../application/profile-photo.store';
import { ProfileStore } from '../application/profile.store';

addIcons({
  checkmarkCircle,
  chevronForward,
  fitnessOutline,
  lockClosedOutline,
  logOutOutline,
  mailUnreadOutline,
  optionsOutline,
  pencilOutline,
  peopleOutline,
  trashOutline,
});

interface Section {
  icon: string;
  title: string;
  subtitle?: string;
  link: string;
}

const SECTIONS: Section[] = [
  {
    icon: 'people-outline',
    title: 'Amigos',
    subtitle: 'Tus amigos y solicitudes',
    link: 'amigos',
  },
  {
    icon: 'fitness-outline',
    title: 'Perfil deportivo',
    subtitle: 'Nivel, objetivos, ritmo y distancia',
    link: 'deportivo',
  },
  {
    icon: 'options-outline',
    title: 'Preferencias',
    subtitle: 'Apariencia, letra, unidades y notificaciones',
    link: 'preferencias',
  },
  { icon: 'lock-closed-outline', title: 'Cambiar contraseña', link: 'contrasena' },
];

/** The account tab: who the user is and the entry to every account screen. */
@Component({
  selector: 'app-profile-home-page',
  imports: [
    RouterLink,
    Avatar,
    IonButton,
    IonContent,
    IonIcon,
    IonItem,
    IonLabel,
    IonList,
    IonSpinner,
    Notice,
    TabHeader,
  ],
  template: `
    <app-tab-header title="Cuenta" />
    <ion-content class="ion-padding">
      @if (profile(); as data) {
        <section class="card identity" aria-label="Tu perfil">
          <app-avatar [name]="fullName()" [photo]="photos.photo()" size="7rem" />
          <ion-button
            class="edit"
            fill="clear"
            routerLink="datos"
            aria-label="Editar perfil"
          >
            <ion-icon name="pencil-outline" slot="icon-only" aria-hidden="true" />
          </ion-button>
          <div class="who">
            <h1>{{ fullName() }}</h1>
            <p class="muted">{{ data.email }}</p>
            <p class="chips">
              @if (verified()) {
                <span class="chip ok"
                  ><ion-icon name="checkmark-circle" aria-hidden="true" /> Correo verificado</span
                >
              } @else {
                <span class="chip warn"
                  ><ion-icon name="mail-unread-outline" aria-hidden="true" /> Correo sin
                  verificar</span
                >
              }
            </p>
          </div>
        </section>
      } @else if (store.loading()) {
        <p class="state" role="status"><ion-spinner name="crescent" /> Cargando tu perfil…</p>
      } @else if (store.error(); as failure) {
        <app-notice [message]="failure" />
        <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
      }

      <ion-list class="options" lines="full">
        @for (section of sections; track section.link) {
          <ion-item button detail="false" [routerLink]="section.link">
            <ion-icon [name]="section.icon" slot="start" aria-hidden="true" />
            <ion-label>
              {{ section.title }}
              @if (section.subtitle) {
                <p>{{ section.subtitle }}</p>
              }
            </ion-label>
            @if (section.link === 'amigos' && friends.incoming().length > 0) {
              <span class="count" slot="end" [attr.aria-label]="pendingLabel()">{{
                friends.incoming().length
              }}</span>
            }
            <ion-icon name="chevron-forward" slot="end" aria-hidden="true" />
          </ion-item>
        }
      </ion-list>

      <h2>Sesión</h2>
      <ion-button expand="block" fill="outline" (click)="signOut()">
        <ion-icon name="log-out-outline" slot="start" aria-hidden="true" />
        Cerrar sesión
      </ion-button>
      <ion-list inset="true" lines="none">
        <ion-item button detail="false" routerLink="eliminar" class="danger">
          <ion-icon name="trash-outline" slot="start" aria-hidden="true" />
          <ion-label>
            Eliminar cuenta
            <p>Borra tus datos de forma permanente</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
  styles: `
    // Dark rounded cards on the near-black page (raised white cards in the light theme).
    .card {
      padding: var(--rc-space-xl);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .identity {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--rc-space-md);
      text-align: center;
    }

    .edit {
      position: absolute;
      inset-block-start: var(--rc-space-sm);
      inset-inline-end: var(--rc-space-sm);
      --color: var(--rc-text);
      min-width: var(--rc-min-touch-target);
      min-height: var(--rc-min-touch-target);
    }

    .options {
      margin: var(--rc-space-lg) 0 0;
      border: 0;
      background: transparent;
    }

    .options ion-item {
      --background: transparent;
      min-height: var(--rc-min-touch-target);
    }


    h1 {
      margin: 0;
      font-size: var(--rc-font-size-title);
      font-weight: 600;
    }

    h2 {
      margin: var(--rc-space-xl) 0 var(--rc-space-sm);
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .muted {
      margin: 0;
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
      overflow-wrap: anywhere;
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--rc-space-xs);
      margin: var(--rc-space-sm) 0 0;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--rc-space-xs);
      padding: 2px var(--rc-space-sm);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface);
      color: var(--rc-text);
      font-size: var(--rc-font-size-caption);
    }

    .ok ion-icon {
      color: var(--rc-success);
    }

    .warn ion-icon {
      color: var(--rc-warning);
    }

    .state {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      color: var(--rc-text-muted);
    }

    ion-list {
      margin-inline: 0;
      border: 1px solid var(--rc-border);
    }

    ion-item ion-icon[slot='start'] {
      color: var(--rc-text-muted);
    }

    .count {
      min-width: 1.5rem;
      padding: 2px var(--rc-space-sm);
      border-radius: var(--rc-radius-pill);
      background: var(--rc-surface);
      color: var(--rc-text);
      font-size: var(--rc-font-size-caption);
      font-weight: 600;
      text-align: center;
    }

    .danger {
      --color: var(--rc-danger);
    }

    .danger ion-icon[slot='start'] {
      color: var(--rc-danger);
    }
  `,
})
export class ProfileHomePage {
  protected readonly store = inject(ProfileStore);
  protected readonly photos = inject(ProfilePhotoStore);
  protected readonly friends = inject(FriendsStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(ConfirmDialog);

  protected readonly sections = SECTIONS;
  protected readonly profile = this.store.profile;
  protected readonly verified = computed(() => this.auth.session()?.emailVerified === true);
  protected readonly fullName = computed(() => {
    const data = this.profile();
    return data ? `${data.firstName} ${data.lastName}` : '';
  });

  protected readonly pendingLabel = computed(() => {
    const count = this.friends.incoming().length;
    return `${count} ${count === 1 ? 'solicitud pendiente' : 'solicitudes pendientes'}`;
  });

  constructor() {
    void this.store.load();
    void this.photos.load();
    // For the badge of «Amigos»; a failure is shown on that page, not here.
    void this.friends.load();
  }

  protected async signOut(): Promise<void> {
    const confirmed = await this.dialog.confirm({
      header: 'Cerrar sesión',
      message: '¿Quieres cerrar tu sesión en este dispositivo?',
      confirmText: 'Cerrar sesión',
    });
    if (!confirmed) return;
    // The local session is cleared even if Firebase fails; leaving the area is what matters.
    await this.auth.signOut().catch(() => undefined);
    await this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
