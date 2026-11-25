import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/roles/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-rol-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class RolListaPage {
  protected readonly entidad = ENTIDADES.roles;
}
