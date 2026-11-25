import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/clubes/) o editar (PUT /api/clubes/:id/) un club. */
@Component({
  selector: 'app-club-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class ClubFormPage {
  /** Parámetro :id de la URL; vacío en /clubes/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.clubes;
}
