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
  personOutline,
  trashOutline,
} from 'ionicons/icons';
import { CitiesStore } from '../../cities/application/cities.store';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { Notice } from '../../shared/ui/notice';
import { TabHeader } from '../../shared/ui/tab-header';
import { ProfileStore } from '../application/profile.store';

addIcons({
  checkmarkCircle,
  chevronForward,
  fitnessOutline,
  lockClosedOutline,
  logOutOutline,
  mailUnreadOutline,
  optionsOutline,
  personOutline,
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
    icon: 'person-outline',
    title: 'Datos personales',
    subtitle: 'Nombre, fecha de nacimiento, ciudad y cédula',
    link: 'datos',
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
          <span class="avatar" aria-hidden="true">{{ initials() }}</span>
          <div>
            <h1>{{ data.firstName }} {{ data.lastName }}</h1>
            <p class="muted">{{ data.email }}</p>
            <p class="chips">
              <span class="chip">{{ cityName() }}</span>
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
        <dl class="card facts">
          <div>
            <dt>Fecha de nacimiento</dt>
            <dd>{{ data.birthDate }}</dd>
          </div>
          @if (data.idNumber) {
            <div>
              <dt>Cédula</dt>
              <dd>{{ data.idNumber }}</dd>
            </div>
          }
        </dl>
      } @else if (store.loading()) {
        <p class="state" role="status"><ion-spinner name="crescent" /> Cargando tu perfil…</p>
      } @else if (store.error(); as failure) {
        <app-notice [message]="failure" />
        <ion-button fill="outline" (click)="store.load()">Reintentar</ion-button>
      }

      <h2>Tu cuenta</h2>
      <ion-list inset="true" lines="full">
        @for (section of sections; track section.link) {
          <ion-item button detail="false" [routerLink]="section.link">
            <ion-icon [name]="section.icon" slot="start" aria-hidden="true" />
            <ion-label>
              {{ section.title }}
              @if (section.subtitle) {
                <p>{{ section.subtitle }}</p>
              }
            </ion-label>
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
      display: flex;
      align-items: center;
      gap: var(--rc-space-lg);
    }

    .avatar {
      display: grid;
      flex: none;
      place-items: center;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font-family: var(--rc-font-family-display);
      font-size: 1.75rem;
      font-weight: 600;
      box-shadow: 0 0 18px color-mix(in srgb, var(--rc-primary) 35%, transparent);
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

    .facts {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xl);
      margin: var(--rc-space-md) 0 0;
    }

    dt {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-caption);
    }

    dd {
      margin: 0;
      font-weight: 500;
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
      color: var(--rc-primary-text);
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
  private readonly cities = inject(CitiesStore);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly dialog = inject(ConfirmDialog);

  protected readonly sections = SECTIONS;
  protected readonly profile = this.store.profile;
  protected readonly verified = computed(() => this.auth.session()?.emailVerified === true);
  protected readonly initials = computed(() => {
    const data = this.profile();
    return data ? `${data.firstName.charAt(0)}${data.lastName.charAt(0)}`.toUpperCase() : '';
  });
  protected readonly cityName = computed(() => {
    const id = this.profile()?.cityId ?? '';
    return this.cities.byId().get(id)?.name ?? id;
  });

  constructor() {
    void this.store.load();
    void this.cities.load();
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
