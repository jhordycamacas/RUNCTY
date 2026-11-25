import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/valoraciones/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-valoracion-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class ValoracionListaPage {
  protected readonly entidad = ENTIDADES.valoraciones;
}
