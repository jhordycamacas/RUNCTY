import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/rutas/) o editar (PUT /api/rutas/:id/) una ruta. */
@Component({
  selector: 'app-ruta-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class RutaFormPage {
  /** Parámetro :id de la URL; vacío en /rutas/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.rutas;
}
