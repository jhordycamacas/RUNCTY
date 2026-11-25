import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/metas/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-meta-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class MetaListaPage {
  protected readonly entidad = ENTIDADES.metas;
}
