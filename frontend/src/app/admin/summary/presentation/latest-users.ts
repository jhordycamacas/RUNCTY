import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Avatar } from '../../../shared/ui/avatar';
import { recentDate } from '../domain/labels';
import { LatestUser } from '../domain/summary';
import { PanelHead } from './panel-head';

/** The newest accounts: an avatar with the initials, a name, a city and how long ago. */
@Component({
  selector: 'app-latest-users',
  imports: [Avatar, PanelHead, RouterLink],
  template: `
    <section class="card" aria-labelledby="latest-title">
      <app-panel-head
        icon="people-outline"
        titleId="latest-title"
        title="Últimos usuarios registrados"
        note="Las cuentas más recientes; toca una para ver su detalle."
      />
      @if (rows().length === 0) {
        <p class="none">Todavía no hay usuarios registrados.</p>
      } @else {
        <ul class="list">
          @for (row of rows(); track row.uid) {
            <li>
              <a class="row" [routerLink]="['/admin/usuarios', row.uid]">
                <app-avatar [name]="row.name" size="2.25rem" />
                <span class="who">
                  <span class="name">{{ row.name }}</span>
                  @if (row.city) {
                    <span class="city">{{ row.city }}</span>
                  }
                </span>
                <time class="when" [attr.datetime]="row.createdAt">{{ row.when }}</time>
              </a>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .card {
      display: grid;
      align-content: start;
      gap: var(--rc-space-md);
      height: 100%;
      min-width: 0;
      padding: var(--rc-space-xl);
      border: 1px solid var(--rc-border);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
    }

    .none {
      margin: 0;
      color: var(--rc-text-muted);
    }

    .list {
      display: grid;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li + li {
      border-top: 1px solid var(--rc-border);
    }

    .row {
      display: flex;
      align-items: center;
      gap: var(--rc-space-md);
      min-height: 3rem;
      padding: var(--rc-space-sm) 0;
      color: inherit;
      text-decoration: none;
    }

    .row:hover .name {
      text-decoration: underline;
    }

    .row:focus-visible {
      outline: 2px solid var(--rc-primary-text);
      outline-offset: 2px;
      border-radius: var(--rc-radius-sm);
    }

    .who {
      display: grid;
      flex: 1;
      min-width: 0;
    }

    .name,
    .city {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .name {
      font-weight: 500;
    }

    .city,
    .when {
      font-size: var(--rc-font-size-label);
      color: var(--rc-text-muted);
    }

    .when {
      flex: none;
    }
  `,
})
export class LatestUsers {
  readonly users = input.required<readonly LatestUser[]>();
  /** City names by id; a city that is not here is left out of the row. */
  readonly cityNames = input<ReadonlyMap<string, string>>(new Map());
  /** The clock the relative dates count from. */
  readonly now = input(new Date());

  protected readonly rows = computed(() =>
    this.users().map((user) => ({
      uid: user.uid,
      name: `${user.firstName} ${user.lastName}`.trim() || 'Sin nombre',
      city: (user.cityId && this.cityNames().get(user.cityId)) || '',
      createdAt: user.createdAt,
      when: recentDate(user.createdAt, this.now()),
    })),
  );
}
