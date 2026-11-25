import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/membresias/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-membresia-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class MembresiaListaPage {
  protected readonly entidad = ENTIDADES.membresias;
}
