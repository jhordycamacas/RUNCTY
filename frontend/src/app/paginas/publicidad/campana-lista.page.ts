import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/campanas/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-campana-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class CampanaListaPage {
  protected readonly entidad = ENTIDADES.campanas;
}
