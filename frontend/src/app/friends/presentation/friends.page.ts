import { Component, inject, signal } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonLabel,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
} from '@ionic/angular';
import { ConfirmDialog } from '../../shared/ui/confirm-dialog';
import { Notice } from '../../shared/ui/notice';
import { SubpageHeader } from '../../shared/ui/subpage-header';
import { FriendsStore } from '../application/friends.store';
import { Friend, MIN_SEARCH_CHARS, fullName } from '../domain/friend';
import { PersonRow } from './person-row';

type Tab = 'friends' | 'requests' | 'search';

const SEARCH_DEBOUNCE_MS = 400;

/**
 * «Amigos» page (RF-22): the friends of the account, the requests it sent and received, and a
 * name search to find more people. Other people only show as their name (limited public profile).
 */
@Component({
  selector: 'app-friends-page',
  imports: [
    IonButton,
    IonContent,
    IonLabel,
    IonSearchbar,
    IonSegment,
    IonSegmentButton,
    IonSpinner,
    Notice,
    PersonRow,
    SubpageHeader,
  ],
  template: `
    <app-subpage-header title="Amigos" />
    <ion-content>
      <div class="page">
        <ion-segment
          [value]="tab()"
          (ionChange)="select($event.detail.value)"
          aria-label="Secciones de amigos"
        >
          <ion-segment-button value="friends"><ion-label>Amigos</ion-label></ion-segment-button>
          <ion-segment-button value="requests">
            <ion-label>
              Solicitudes
              @if (store.incoming().length > 0) {
                <span class="count" [attr.aria-label]="store.incoming().length + ' por responder'"
                  >({{ store.incoming().length }})</span
                >
              }
            </ion-label>
          </ion-segment-button>
          <ion-segment-button value="search"><ion-label>Buscar</ion-label></ion-segment-button>
        </ion-segment>

        <app-notice [message]="store.error()" />

        @switch (tab()) {
          @case ('friends') {
            @if (store.loading() && store.friends().length === 0) {
              <p class="state" role="status"><ion-spinner name="crescent" /> Cargando amigos…</p>
            } @else if (store.friends().length === 0) {
              <section class="empty" role="status">
                <h2>Aún no tienes amigos</h2>
                <p>Busca a otros corredores por su nombre y envíales una solicitud.</p>
                <ion-button class="action" (click)="select('search')">Buscar personas</ion-button>
              </section>
            } @else {
              <ul>
                @for (friend of store.friends(); track friend.profile.uid) {
                  <li>
                    <app-person-row [name]="name(friend)" [detail]="since(friend)">
                      <ion-button
                        class="action secondary"
                        fill="outline"
                        [disabled]="store.working()"
                        [attr.aria-label]="'Quitar a ' + name(friend) + ' de tus amigos'"
                        (click)="confirmRemove(friend)"
                        >Quitar</ion-button
                      >
                    </app-person-row>
                  </li>
                }
              </ul>
            }
          }
          @case ('requests') {
            @if (store.incoming().length === 0 && store.outgoing().length === 0) {
              <section class="empty" role="status">
                <h2>No tienes solicitudes pendientes</h2>
                <p>Cuando alguien te envíe una solicitud, la verás aquí.</p>
              </section>
            }
            @if (store.incoming().length > 0) {
              <h2 class="heading">Recibidas</h2>
              <ul>
                @for (request of store.incoming(); track request.id) {
                  <li>
                    <app-person-row [name]="fullName(request.profile)">
                      <ion-button
                        class="action"
                        [disabled]="store.working()"
                        [attr.aria-label]="'Aceptar la solicitud de ' + fullName(request.profile)"
                        (click)="store.accept(request.id)"
                        >Aceptar</ion-button
                      >
                      <ion-button
                        class="action secondary"
                        fill="outline"
                        [disabled]="store.working()"
                        [attr.aria-label]="'Rechazar la solicitud de ' + fullName(request.profile)"
                        (click)="store.reject(request.id)"
                        >Rechazar</ion-button
                      >
                    </app-person-row>
                  </li>
                }
              </ul>
            }
            @if (store.outgoing().length > 0) {
              <h2 class="heading">Enviadas</h2>
              <ul>
                @for (request of store.outgoing(); track request.id) {
                  <li>
                    <app-person-row [name]="fullName(request.profile)" detail="Pendiente">
                      <ion-button
                        class="action secondary"
                        fill="outline"
                        [disabled]="store.working()"
                        [attr.aria-label]="'Cancelar la solicitud a ' + fullName(request.profile)"
                        (click)="store.cancel(request.id)"
                        >Cancelar</ion-button
                      >
                    </app-person-row>
                  </li>
                }
              </ul>
            }
          }
          @case ('search') {
            <ion-searchbar
              placeholder="Buscar por nombre"
              aria-label="Buscar personas por nombre"
              [debounce]="debounceMs"
              (ionInput)="onQuery($event.detail.value)"
            />
            @if (query().length < minChars) {
              <p class="hint">Escribe al menos {{ minChars }} letras del nombre.</p>
            } @else if (store.searching()) {
              <p class="state" role="status"><ion-spinner name="crescent" /> Buscando…</p>
            } @else if (store.searchedText() && store.results().length === 0) {
              <section class="empty" role="status">
                <h2>No encontramos a nadie</h2>
                <p>Revisa el nombre e inténtalo de nuevo.</p>
              </section>
            } @else {
              <ul>
                @for (result of store.results(); track result.profile.uid) {
                  <li>
                    <app-person-row [name]="fullName(result.profile)">
                      @switch (result.relation) {
                        @case ('friend') {
                          <span class="status">Ya son amigos</span>
                        }
                        @case ('request-sent') {
                          <span class="status">Solicitud enviada</span>
                        }
                        @case ('request-received') {
                          <ion-button class="action" (click)="select('requests')"
                            >Responder</ion-button
                          >
                        }
                        @default {
                          <ion-button
                            class="action"
                            [disabled]="store.working()"
                            [attr.aria-label]="'Agregar a ' + fullName(result.profile)"
                            (click)="store.send(result.profile.uid)"
                            >Agregar</ion-button
                          >
                        }
                      }
                    </app-person-row>
                  </li>
                }
              </ul>
            }
          }
        }
      </div>
    </ion-content>
  `,
  styles: `
    .page {
      display: grid;
      gap: var(--rc-space-lg);
      padding: var(--rc-space-sm) var(--rc-space-lg) var(--rc-space-xxl);
    }

    ion-segment-button {
      min-height: var(--rc-min-touch-target);
    }

    ul {
      display: grid;
      gap: var(--rc-space-md);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .state,
    .hint {
      display: flex;
      align-items: center;
      gap: var(--rc-space-sm);
      margin: 0;
      color: var(--rc-text-muted);
    }

    .empty {
      display: grid;
      justify-items: center;
      gap: var(--rc-space-sm);
      padding: var(--rc-space-xxl) var(--rc-space-lg);
      border-radius: var(--rc-radius-lg);
      background: var(--rc-surface-elevated);
      text-align: center;
    }

    .empty h2,
    .heading {
      margin: 0;
      font-size: var(--rc-font-size-subtitle);
      font-weight: 600;
    }

    .empty p {
      margin: 0;
      color: var(--rc-text-muted);
    }

    .action {
      min-width: var(--rc-min-touch-target);
      min-height: var(--rc-min-touch-target);
    }

    .secondary {
      --color: var(--rc-text);
      --border-color: var(--rc-border);
    }

    .status {
      color: var(--rc-text-muted);
      font-size: var(--rc-font-size-label);
    }
  `,
})
export class FriendsPage {
  protected readonly store = inject(FriendsStore);
  private readonly dialog = inject(ConfirmDialog);

  protected readonly tab = signal<Tab>('friends');
  protected readonly query = signal('');
  protected readonly minChars = MIN_SEARCH_CHARS;
  protected readonly debounceMs = SEARCH_DEBOUNCE_MS;
  protected readonly fullName = fullName;

  constructor() {
    this.store.clearSearch();
    void this.store.load();
  }

  protected select(value: string | number | null | undefined): void {
    if (value === 'friends' || value === 'requests' || value === 'search') this.tab.set(value);
  }

  protected onQuery(value: string | null | undefined): void {
    const text = (value ?? '').trim();
    this.query.set(text);
    void this.store.search(text);
  }

  protected name(friend: Friend): string {
    return fullName(friend.profile);
  }

  /** «Amigos desde 23/11/2026», or nothing when the stored date is unreadable. */
  protected since(friend: Friend): string | null {
    const date = new Date(friend.since);
    if (Number.isNaN(date.getTime())) return null;
    const day = date.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    return `Amigos desde ${day}`;
  }

  protected async confirmRemove(friend: Friend): Promise<void> {
    const confirmed = await this.dialog.confirm({
      header: 'Quitar amigo',
      message: `¿Quieres quitar a ${fullName(friend.profile)} de tus amigos?`,
      confirmText: 'Quitar',
      destructive: true,
    });
    if (confirmed) await this.store.remove(friend.profile.uid);
  }
}
