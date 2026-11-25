import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/rutas-club/) o editar (PUT /api/rutas-club/:id/) una ruta del club. */
@Component({
  selector: 'app-ruta-club-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class RutaClubFormPage {
  /** Parámetro :id de la URL; vacío en /rutas-club/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['rutas-club'];
}
