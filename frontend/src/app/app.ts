import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonApp, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider, IonItemGroup, IonLabel, IonList,
  IonMenu, IonMenuToggle, IonRouterOutlet, IonSplitPane, IonTitle, IonToolbar,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import {
  add, alert, alertCircle, business, calendar, call, chatbubbles, closeCircle, create, fitness, flag,
  gitCommit, gitNetwork, heart, home, idCard, images, informationCircle, key, list, locate, map, medkit,
  megaphone, navigate, notifications, people, peopleCircle, person, personCircle, pin, settings, shield,
  shieldCheckmark, shieldHalf, star, stopwatch, storefront, ticket, time, trailSign, trash, trophy, walk,
  warning,
} from 'ionicons/icons';

import { MODULOS, entidadesDelModulo } from './core/entidades';

/** Armazón de la app: menú lateral por módulo (split pane en pantallas anchas) y router de Ionic. */
@Component({
  selector: 'app-root',
  imports: [
    RouterLink, RouterLinkActive, IonApp, IonContent, IonHeader, IonIcon, IonItem, IonItemDivider,
    IonItemGroup, IonLabel, IonList, IonMenu, IonMenuToggle, IonRouterOutlet, IonSplitPane, IonTitle,
    IonToolbar,
  ],
  styles: `
    .marca { display: flex; align-items: center; gap: 10px; }
    .marca img { width: 28px; height: 28px; border-radius: 6px; }
    ion-item.activo { --color: var(--ion-color-primary); font-weight: 600; }
    ion-item.activo ion-icon { color: var(--ion-color-primary); }
    ion-item-divider { --color: #5a606b; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
  `,
  template: `
    <ion-app>
      <ion-split-pane contentId="principal">
        <ion-menu contentId="principal" type="overlay">
          <ion-header>
            <ion-toolbar>
              <ion-title><span class="marca"><img src="logo.png" alt="" /> RUNCTY</span></ion-title>
            </ion-toolbar>
          </ion-header>
          <ion-content>
            <ion-list lines="none">
              <ion-menu-toggle [autoHide]="false">
                <ion-item routerLink="/inicio" routerLinkActive="activo" routerDirection="root" button>
                  <ion-icon slot="start" name="home"></ion-icon>
                  <ion-label>Inicio</ion-label>
                </ion-item>
              </ion-menu-toggle>
              @for (grupo of menu; track grupo.modulo.clave) {
                <ion-item-group>
                  <ion-item-divider>
                    <ion-icon slot="start" [name]="grupo.modulo.icono"></ion-icon>
                    <ion-label>{{ grupo.modulo.titulo }}</ion-label>
                  </ion-item-divider>
                  @for (entidad of grupo.entidades; track entidad.endpoint) {
                    <ion-menu-toggle [autoHide]="false">
                      <ion-item [routerLink]="['/', entidad.endpoint]" routerLinkActive="activo"
                        routerDirection="root" button>
                        <ion-icon slot="start" [name]="entidad.icono"></ion-icon>
                        <ion-label>{{ entidad.plural }}</ion-label>
                      </ion-item>
                    </ion-menu-toggle>
                  }
                </ion-item-group>
              }
            </ion-list>
          </ion-content>
        </ion-menu>
        <ion-router-outlet id="principal"></ion-router-outlet>
      </ion-split-pane>
    </ion-app>
  `,
})
export class App {
  protected readonly menu = MODULOS.map((modulo) => ({ modulo, entidades: entidadesDelModulo(modulo.clave) }));

  constructor() {
    addIcons({
      add, alert, alertCircle, business, calendar, call, chatbubbles, closeCircle, create, fitness, flag,
      gitCommit, gitNetwork, heart, home, idCard, images, informationCircle, key, list, locate, map, medkit,
      megaphone, navigate, notifications, people, peopleCircle, person, personCircle, pin, settings, shield,
      shieldCheckmark, shieldHalf, star, stopwatch, storefront, ticket, time, trailSign, trash, trophy, walk,
      warning,
    });
  }
}
