import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/perfiles-deportivos/) o editar (PUT /api/perfiles-deportivos/:id/) un perfil deportivo. */
@Component({
  selector: 'app-perfil-deportivo-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class PerfilDeportivoFormPage {
  /** Parámetro :id de la URL; vacío en /perfiles-deportivos/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES['perfiles-deportivos'];
}
