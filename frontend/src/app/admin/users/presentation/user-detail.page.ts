import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonIcon, IonSpinner, ViewWillEnter } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { pencilOutline } from 'ionicons/icons';
import { CitiesStore } from '../../../cities/application/cities.store';
import { ageOn } from '../../../auth/domain/birth-date';
import { AuthService } from '../../../core/auth/auth.service';
import { ConfirmDialog } from '../../../shared/ui/confirm-dialog';
import { Notice } from '../../../shared/ui/notice';
import { ToastService } from '../../../shared/ui/toast.service';
import { SportOptionsStore } from '../../../sport-profile/application/sport-options.store';
import { formatPace } from '../../../sport-profile/domain/sport-profile';
import { AdminHeader } from '../../admin-header';
import { AdminRolesStore } from '../../roles/application/admin-roles.store';
import { UserDetailStore } from '../application/user-detail.store';
import { fullName } from '../domain/managed-user';
import { displayDate } from '../domain/user-detail';
import { RatingStars } from './rating-stars';
import { UserPersonalEdit } from './user-personal-edit';
import { UserSportEdit } from './user-sport-edit';

const MISSING = 'No indicado';

addIcons({ pencilOutline });

/**
 * The admin detail of one user (`/admin/usuarios/:uid`): the personal profile, the sport profile
 * and the rating. Who has `users.manage` edits the first two in place and can delete the user.
 */
@Component({
  selector: 'app-user-detail-page',
  imports: [
    AdminHeader,
    IonButton,
    IonContent,
    IonIcon,
    IonSpinner,
    Notice,
    RatingStars,
    RouterLink,
    UserPersonalEdit,
    UserSportEdit,
  ],
  template: `
    <app-admin-header [title]="title()" backTo="/admin/usuarios" />
    <ion-content class="ion-padding">
      @if (store.detail(); as detail) {
        @if (store.error(); as failure) {
          <div class="state">
            <app-notice [message]="failure" />
            <ion-button fill="outline" (click)="store.reload()">Reintentar</ion-button>
          </div>
        }

        <div class="panels">
          <section class="panel" aria-labelledby="personal-title">
            <div class="panel-head">
              <h2 id="personal-title">Perfil personal</h2>
              @if (canManage && !editingPersonal()) {
                <ion-button
                  fill="clear"
                  aria-label="Editar perfil personal"
                  title="Editar"
                  class="edit-personal"
                  (click)="editingPersonal.set(true)"
                >
                  <ion-icon name="pencil-outline" slot="icon-only" aria-hidden="true" />
                </ion-button>
              }
            </div>
            @if (editingPersonal()) {
              <app-user-personal-edit
                [user]="detail.user"
                (saved)="editingPersonal.set(false)"
                (cancelled)="editingPersonal.set(false)"
              />
            } @else {
              <dl>
                <div>
                  <dt>Nombre</dt>
                  <dd>{{ title() }}</dd>
                </div>
                <div>
                  <dt>Correo electrónico</dt>
                  <dd>
                    {{ detail.user.email }}
                    @if (detail.user.emailVerified !== null) {
                      <span class="tag" [class.warn]="!detail.user.emailVerified">{{
                        detail.user.emailVerified ? 'Verificado' : 'Sin verificar'
                      }}</span>
                    }
                  </dd>
                </div>
                <div>
                  <dt>Cédula</dt>
                  <dd>{{ detail.user.idNumber ?? 'No registrada' }}</dd>
                </div>
                <div>
                  <dt>Fecha de nacimiento</dt>
                  <dd>{{ birth() }}</dd>
                </div>
                <div>
                  <dt>Ciudad</dt>
                  <dd>{{ cityName() }}</dd>
                </div>
                <div>
                  <dt>Rol</dt>
                  <dd>{{ roles.roleName(detail.user.role) }}</dd>
                </div>
                @if (detail.user.createdAt; as createdAt) {
                  <div>
                    <dt>Registrado</dt>
                    <dd>{{ displayDate(createdAt) }}</dd>
                  </div>
                }
              </dl>
            }
          </section>

          <section class="panel" aria-labelledby="sport-title">
            <div class="panel-head">
              <h2 id="sport-title">Perfil deportivo</h2>
              @if (canManage && !editingSport()) {
                <ion-button
                  fill="clear"
                  aria-label="Editar perfil deportivo"
                  title="Editar"
                  class="edit-sport"
                  (click)="editingSport.set(true)"
                >
                  <ion-icon name="pencil-outline" slot="icon-only" aria-hidden="true" />
                </ion-button>
              }
            </div>
            @if (editingSport()) {
              <app-user-sport-edit
                [sport]="detail.sportProfile"
                (saved)="editingSport.set(false)"
                (cancelled)="editingSport.set(false)"
              />
            } @else if (detail.sportProfile; as sport) {
              <dl>
                <div>
                  <dt>Nivel</dt>
                  <dd>{{ sport.level ? levelLabel(sport.level) : missing }}</dd>
                </div>
                <div>
                  <dt>Objetivos</dt>
                  <dd>
                    @if (sport.goals.length > 0) {
                      <ul class="goals">
                        @for (goal of sport.goals; track goal) {
                          <li class="tag">{{ goalLabel(goal) }}</li>
                        }
                      </ul>
                    } @else {
                      {{ missing }}
                    }
                  </dd>
                </div>
                <div>
                  <dt>Ritmo habitual</dt>
                  <dd>{{ pace(sport.usualPaceSecPerKm) }}</dd>
                </div>
                <div>
                  <dt>Distancia preferida</dt>
                  <dd>{{ distance(sport.preferredDistanceKm) }}</dd>
                </div>
              </dl>
            } @else {
              <p class="muted">Este usuario aún no completó su perfil deportivo.</p>
            }
          </section>

          <section class="panel" aria-labelledby="rating-title">
            <h2 id="rating-title">Valoración</h2>
            @if (detail.rating; as rating) {
              <app-rating-stars [average]="rating.average" [count]="rating.count" />
            } @else {
              <p class="muted">Aún no tiene valoraciones.</p>
            }
          </section>
        </div>

        @if (canManage) {
          <section class="panel danger-zone" aria-labelledby="danger-title">
            <h2 id="danger-title">Eliminar usuario</h2>
            <p class="muted">
              Se borran la cuenta, el perfil, el perfil deportivo y la foto de este usuario. No se
              puede deshacer.
            </p>
            @if (isSelf()) {
              <p class="muted">No puedes eliminar tu propia cuenta desde el panel.</p>
            }
            <ion-button
              fill="outline"
              color="danger"
              [disabled]="isSelf() || deleting()"
              (click)="remove()"
            >
              Eliminar usuario
            </ion-button>
          </section>
        }
      } @else if (store.notFound()) {
        <div class="state">
          <app-notice message="No encontramos a este usuario." />
          <ion-button fill="outline" routerLink="/admin/usuarios">Volver a usuarios</ion-button>
        </div>
      } @else if (store.error(); as failure) {
        <div class="state">
          <app-notice [message]="failure" />
          <ion-button fill="outline" (click)="store.reload()">Reintentar</ion-button>
        </div>
      } @else {
        <p class="state muted" role="status"><ion-spinner name="crescent" /> Cargando usuario…</p>
      }
    </ion-content>
  `,
  styles: `
    .panels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
      align-items: start;
      gap: var(--rc-space-lg);
    }

    .panel {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      min-width: 0;
      padding: var(--rc-space-xl);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .panel-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--rc-space-sm);
    }

    .panel-head ion-button {
      min-width: var(--rc-min-touch-target);
      min-height: var(--rc-min-touch-target);
    }

    .danger-zone {
      margin-top: var(--rc-space-lg);
      border: 1px solid var(--rc-danger);
    }

    .danger-zone ion-button {
      align-self: flex-start;
      min-height: var(--rc-min-touch-target);
    }

    h2 {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 500;
    }

    dl {
      display: flex;
      flex-direction: column;
      gap: var(--rc-space-md);
      margin: 0;
    }

    dt {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }

    dd {
      margin: 0;
      overflow-wrap: anywhere;
    }

    .goals {
      display: flex;
      flex-wrap: wrap;
      gap: var(--rc-space-xs);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .tag {
      display: inline-block;
      padding: 0 var(--rc-space-sm);
      border-radius: var(--rc-radius-sm);
      background: var(--rc-surface);
      font-size: var(--rc-font-size-label);
    }

    .tag.warn {
      background: var(--rc-warning-tint);
      color: var(--rc-warning);
    }

    .state {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--rc-space-sm);
      margin-bottom: var(--rc-space-lg);
    }

    .muted {
      margin: 0;
      color: var(--rc-text-muted);
    }
  `,
})
export class UserDetailPage implements ViewWillEnter {
  protected readonly store = inject(UserDetailStore);
  protected readonly roles = inject(AdminRolesStore);
  private readonly cities = inject(CitiesStore);
  private readonly sportOptions = inject(SportOptionsStore);
  private readonly uid = inject(ActivatedRoute).snapshot.paramMap.get('uid') ?? '';
  private readonly auth = inject(AuthService);
  private readonly dialog = inject(ConfirmDialog);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Only who has `users.manage` sees the pencils and the delete zone. */
  protected readonly canManage = this.auth.can('users.manage');
  protected readonly editingPersonal = signal(false);
  protected readonly editingSport = signal(false);
  protected readonly deleting = signal(false);
  /** The admin cannot delete the account they are signed in with. */
  protected readonly isSelf = computed(
    () => this.store.detail()?.user.uid === this.auth.session()?.uid,
  );

  protected readonly missing = MISSING;
  protected readonly displayDate = displayDate;

  protected readonly title = computed(() => {
    const detail = this.store.detail();
    return detail ? fullName(detail.user) : 'Usuario';
  });

  /** The birth date and, when it reads as a date, the age it makes today. */
  protected readonly birth = computed(() => {
    const birthDate = this.store.detail()?.user.birthDate ?? '';
    if (birthDate === '') return MISSING;
    const age = ageOn(birthDate, new Date());
    return Number.isNaN(age) || age < 0
      ? birthDate
      : `${displayDate(birthDate)} (${age} ${age === 1 ? 'año' : 'años'})`;
  });

  protected readonly cityName = computed(() => {
    const cityId = this.store.detail()?.user.cityId ?? '';
    return cityId === '' ? MISSING : (this.cities.byId().get(cityId)?.name ?? cityId);
  });

  /** Every time the page shows again, it asks the API again. */
  ionViewWillEnter(): void {
    void this.cities.load();
    void this.roles.load();
    void this.sportOptions.load();
    void this.store.load(this.uid);
  }

  protected levelLabel(code: string): string {
    return this.sportOptions.levelLabel(code);
  }

  protected goalLabel(code: string): string {
    return this.sportOptions.goalLabel(code);
  }

  protected pace(secPerKm: number | null): string {
    return secPerKm === null ? MISSING : `${formatPace(secPerKm)} min/km`;
  }

  protected distance(km: number | null): string {
    return km === null ? MISSING : `${String(km).replace('.', ',')} km`;
  }

  protected async remove(): Promise<void> {
    if (this.deleting() || this.isSelf()) return;
    this.deleting.set(true);
    try {
      const deleted = await this.dialog.confirmAction({
        header: 'Eliminar usuario',
        message: `Se borrarán la cuenta de ${this.title()}, su perfil, su perfil deportivo y su foto. Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        destructive: true,
        run: () => this.store.remove(),
      });
      if (!deleted) return;
      await this.toast.success('Usuario eliminado.');
      await this.router.navigateByUrl('/admin/usuarios');
    } finally {
      this.deleting.set(false);
    }
  }
}
