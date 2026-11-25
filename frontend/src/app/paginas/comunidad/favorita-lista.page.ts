import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/favoritas/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-favorita-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class FavoritaListaPage {
  protected readonly entidad = ENTIDADES.favoritas;
}
