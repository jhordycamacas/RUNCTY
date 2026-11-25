import { Component } from '@angular/core';

import { ENTIDADES } from '../../core/entidades';
import { ListaEntidadComponent } from '../compartido/lista-entidad.component';

/** Listado paginado: GET /api/preferencias/ (búsqueda y filtros por la URL). */
@Component({
  selector: 'app-preferencia-lista',
  imports: [ListaEntidadComponent],
  template: `<app-lista-entidad [entidad]="entidad" />`,
})
export class PreferenciaListaPage {
  protected readonly entidad = ENTIDADES.preferencias;
}
