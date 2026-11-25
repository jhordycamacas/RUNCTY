import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/factores-riesgo/) o editar (PUT /api/factores-riesgo/:id/) un factor de riesgo. */
@Component({
  selector: 'app-factor-riesgo-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class FactorRiesgoFormPage {
  /** Parámetro :id de la URL; vacío en /factores-riesgo/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['factores-riesgo'];
}
