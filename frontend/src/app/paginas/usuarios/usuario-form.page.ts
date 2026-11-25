import { Component, input } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { FormularioEntidadComponent } from '../compartido/formulario-entidad.component';

/** Crear (POST /api/usuarios/) o editar (PUT /api/usuarios/:id/) una usuario. */
@Component({
  selector: 'app-usuario-form',
  imports: [FormularioEntidadComponent],
  template: `<app-formulario-entidad [entidad]="entidad" [id]="id()" />`,
})
export class UsuarioFormPage {
  /** Parámetro :id de la URL; vacío en /usuarios/nuevo. */
  readonly id = input<string>();
  protected readonly entidad = ENTIDADES.usuarios;
}
