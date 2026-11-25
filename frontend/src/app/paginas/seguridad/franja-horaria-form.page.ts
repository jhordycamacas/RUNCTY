import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/franjas-horarias/) o editar (PUT /api/franjas-horarias/:id/) una franja horaria. */
@Component({
  selector: 'app-franja-horaria-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class FranjaHorariaFormPage {
  /** Parámetro :id de la URL; vacío en /franjas-horarias/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['franjas-horarias'];
}
