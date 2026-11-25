import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/clubes/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-club-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class ClubListaPage {
  protected readonly entidad = ENTIDADES.clubes;
}
