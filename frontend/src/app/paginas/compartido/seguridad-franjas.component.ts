import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonChip, IonItem, IonLabel, IonList, IonListHeader, IonNote } from '@ionic/angular';

import { RutaRecomendada, SeguridadFranja } from '../../core/modelos';
import { NivelBadgeComponent } from './nivel-badge.component';

/** Una franja con su índice; las rutas recomendadas añaden ruta, nombre y distancia. */
export type FilaSeguridad = SeguridadFranja & Partial<Pick<RutaRecomendada, 'ruta' | 'nombre' | 'distancia_km'>>;

/**
 * Índice de seguridad por franja horaria (puntaje 0-100 y nivel Alto/Medio/Bajo).
 * Sirve para el detalle de una ruta y para las rutas recomendadas de una solicitud.
 */
@Component({
  selector: 'app-seguridad-franjas',
  imports: [RouterLink, IonChip, IonItem, IonLabel, IonList, IonListHeader, IonNote, NivelBadgeComponent],
  styles: `
    .factores { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px; }
    ion-chip { margin: 0; height: 24px; font-size: 0.75rem; }
  `,
  template: `
    <ion-list>
      <ion-list-header>
        <ion-label>{{ titulo() }}</ion-label>
      </ion-list-header>
      @for (item of items(); track $index) {
        <ion-item [routerLink]="enlazarRuta() && item.ruta ? ['/rutas', item.ruta] : null"
                  [detail]="enlazarRuta()">
          <ion-label>
            @if (item.nombre) {
              <h2>{{ $index + 1 }}. {{ item.nombre }} · {{ item.distancia_km }} km</h2>
            }
            <h3>{{ item.franja_nombre }} ({{ item.hora_inicio.slice(0, 5) }}–{{ item.hora_fin.slice(0, 5) }})</h3>
            <p>Puntaje {{ item.puntaje }}/100 · Tramo crítico: {{ item.tramo_critico ?? 'ninguno' }}</p>
            @if (item.factores.length) {
              <div class="factores">
                @for (factor of item.factores; track factor) {
                  <ion-chip color="medium">{{ factor }}</ion-chip>
                }
              </div>
            }
          </ion-label>
          <app-nivel-badge slot="end" [nivel]="item.nivel" />
        </ion-item>
      } @empty {
        <ion-item lines="none">
          <ion-note>{{ vacio() }}</ion-note>
        </ion-item>
      }
    </ion-list>
  `,
})
export class SeguridadFranjasComponent {
  readonly items = input<FilaSeguridad[]>([]);
  readonly titulo = input('Índice de seguridad por franja horaria');
  readonly vacio = input('Sin franjas horarias registradas.');
  readonly enlazarRuta = input(false);
}
