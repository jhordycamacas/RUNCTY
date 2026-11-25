import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/anunciantes/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-anunciante-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class AnuncianteListaPage {
  protected readonly entidad = ENTIDADES.anunciantes;
}
