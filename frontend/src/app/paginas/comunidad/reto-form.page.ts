import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/retos/) o editar (PUT /api/retos/:id/) un reto. */
@Component({
  selector: 'app-reto-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class RetoFormPage {
  /** Parámetro :id de la URL; vacío en /retos/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.retos;
}
