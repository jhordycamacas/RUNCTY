import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/retos/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-reto-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class RetoListaPage {
  protected readonly entidad = ENTIDADES.retos;
}
