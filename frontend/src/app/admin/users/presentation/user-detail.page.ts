import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IonButton, IonContent, IonSpinner, ViewWillEnter } from '@ionic/angular';
import { CitiesStore } from '../../../cities/application/cities.store';
import { ageOn } from '../../../auth/domain/birth-date';
import { Notice } from '../../../shared/ui/notice';
import { SportOptionsStore } from '../../../sport-profile/application/sport-options.store';
import { formatPace } from '../../../sport-profile/domain/sport-profile';
import { AdminHeader } from '../../admin-header';
import { AdminRolesStore } from '../../roles/application/admin-roles.store';
import { UserDetailStore } from '../application/user-detail.store';
import { fullName } from '../domain/managed-user';
import { displayDate } from '../domain/user-detail';
import { RatingStars } from './rating-stars';

const MISSING = 'No indicado';

/**
 * The admin detail of one user (`/admin/usuarios/:uid`): the personal profile, the sport profile
 * and the rating as three read-only panels.
 */
@Component({
  selector: 'app-user-detail-page',
  imports: [AdminHeader, IonButton, IonContent, IonSpinner, Notice, RatingStars, RouterLink],
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
            <h2 id="personal-title">Perfil personal</h2>
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
          </section>

          <section class="panel" aria-labelledby="sport-title">
            <h2 id="sport-title">Perfil deportivo</h2>
            @if (detail.sportProfile; as sport) {
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
}
