import { Component } from '@angular/core';
import { IonContent, IonIcon } from '@ionic/angular';
import { addIcons } from 'ionicons';
import { peopleOutline } from 'ionicons/icons';
import { TabHeader } from '../../shared/ui/tab-header';

addIcons({ peopleOutline });

/**
 * Clubs tab. Clubs, memberships, group runs and club routes are EP-19, EP-21 and EP-11 of the
 * backlog (Sprints 4 and 5); until they exist the tab says what is coming, without fake data.
 */
@Component({
  selector: 'app-clubs-page',
  imports: [IonContent, IonIcon, TabHeader],
  template: `
    <app-tab-header title="Clubes" />
    <ion-content class="ion-padding">
      <section class="empty" aria-labelledby="clubs-title">
        <span class="badge" aria-hidden="true"><ion-icon name="people-outline" /></span>
        <h1 id="clubs-title">Corre en grupo</h1>
        <p>
          Pronto podrás unirte a clubes como Gacelas Running Team, ver sus salidas grupales y las
          rutas que recomiendan.
        </p>
      </section>
    </ion-content>
  `,
  styles: `
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--rc-space-sm);
      margin-top: var(--rc-space-xxl);
      padding: var(--rc-space-xl);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
      text-align: center;
    }

    .badge {
      display: grid;
      place-items: center;
      width: 4rem;
      height: 4rem;
      border-radius: var(--rc-radius-pill);
      background: var(--rc-primary);
      color: var(--rc-on-primary);
      font-size: 2rem;
    }

    h1 {
      margin: var(--rc-space-sm) 0 0;
      font-size: var(--rc-font-size-title);
    }

    p {
      max-width: 22rem;
      margin: 0;
      color: var(--rc-text-muted);
    }
  `,
})
export class ClubsPage {}
