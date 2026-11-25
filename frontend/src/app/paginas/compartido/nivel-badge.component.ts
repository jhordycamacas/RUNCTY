import { Component, computed, input } from '@angular/core';
import { IonBadge } from '@ionic/angular';

import { colorNivel } from './formato';

/** Insignia Alto / Medio / Bajo del índice de seguridad. */
@Component({
  selector: 'app-nivel-badge',
  imports: [IonBadge],
  template: `<ion-badge [color]="color()">{{ nivel() ?? 'Sin datos' }}</ion-badge>`,
})
export class NivelBadgeComponent {
  readonly nivel = input<string | null | undefined>();
  protected readonly color = computed(() => colorNivel(this.nivel()));
}
