import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/alertas-panico/) o editar (PUT /api/alertas-panico/:id/) una alerta de pánico. */
@Component({
  selector: 'app-alerta-panico-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class AlertaPanicoFormPage {
  /** Parámetro :id de la URL; vacío en /alertas-panico/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['alertas-panico'];
}
