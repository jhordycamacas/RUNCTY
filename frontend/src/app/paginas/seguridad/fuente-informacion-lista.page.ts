import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/fuentes-informacion/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-fuente-informacion-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class FuenteInformacionListaPage {
  protected readonly entidad = ENTIDADES['fuentes-informacion'];
}
