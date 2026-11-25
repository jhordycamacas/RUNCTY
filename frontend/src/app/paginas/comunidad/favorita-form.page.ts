import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/favoritas/) o editar (PUT /api/favoritas/:id/) una ruta favorita. */
@Component({
  selector: 'app-favorita-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class FavoritaFormPage {
  /** Parámetro :id de la URL; vacío en /favoritas/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.favoritas;
}
