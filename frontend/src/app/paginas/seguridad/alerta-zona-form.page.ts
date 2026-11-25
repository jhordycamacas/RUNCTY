import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/alertas-zona/) o editar (PUT /api/alertas-zona/:id/) una alerta de zona. */
@Component({
  selector: 'app-alerta-zona-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class AlertaZonaFormPage {
  /** Parámetro :id de la URL; vacío en /alertas-zona/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['alertas-zona'];
}
